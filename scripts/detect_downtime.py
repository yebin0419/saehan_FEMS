"""EMS 비가동 구간 자동 탐지.

각 설비의 전류 시계열에서 연속된 비가동(threshold 이하) 구간을 추출한다.

사용 예:
    python scripts/detect_downtime.py
    python scripts/detect_downtime.py --threshold 0.5 --min-duration 10
    python scripts/detect_downtime.py --output out/downtime.json
"""
from __future__ import annotations

import argparse
import json
from dataclasses import dataclass, asdict
from datetime import datetime
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA_PATH = HERE.parent / "legacy" / "ems_20261013.json"
META_FIELDS = {"index", "time"}


@dataclass
class Interval:
    equipment: str
    start: str
    end: str
    duration_min: float
    samples: int


def parse_time(s: str) -> datetime:
    return datetime.fromisoformat(s)


def find_intervals(
    records: list[dict], equipment: str, threshold: float, min_duration: float
) -> list[Interval]:
    """threshold 이하 값이 연속되는 구간을 추출. 길이는 (end - start) 분 단위."""
    intervals: list[Interval] = []
    run_start_idx: int | None = None

    for i, row in enumerate(records):
        val = row.get(equipment)
        is_idle = isinstance(val, (int, float)) and val <= threshold

        if is_idle and run_start_idx is None:
            run_start_idx = i
        elif not is_idle and run_start_idx is not None:
            intervals.append(_build(records, equipment, run_start_idx, i - 1))
            run_start_idx = None

    if run_start_idx is not None:
        intervals.append(_build(records, equipment, run_start_idx, len(records) - 1))

    return [iv for iv in intervals if iv.duration_min >= min_duration]


def _build(records: list[dict], equipment: str, start_i: int, end_i: int) -> Interval:
    start_t = parse_time(records[start_i]["time"])
    end_t = parse_time(records[end_i]["time"])
    duration = (end_t - start_t).total_seconds() / 60.0
    return Interval(
        equipment=equipment,
        start=records[start_i]["time"],
        end=records[end_i]["time"],
        duration_min=duration,
        samples=end_i - start_i + 1,
    )


def analyze(records: list[dict], threshold: float, min_duration: float) -> dict:
    fields = [k for k in records[0].keys() if k not in META_FIELDS]
    period_t = (parse_time(records[-1]["time"]) - parse_time(records[0]["time"])).total_seconds() / 60.0

    per_equipment = {}
    for field in fields:
        values = [row.get(field) for row in records]
        numeric = [v for v in values if isinstance(v, (int, float))]
        if not numeric:
            continue

        intervals = find_intervals(records, field, threshold, min_duration)
        idle_samples = sum(1 for v in numeric if v <= threshold)
        per_equipment[field] = {
            "idle_ratio": idle_samples / len(numeric),
            "idle_minutes_est": idle_samples,  # 1분 샘플링 가정
            "intervals": [asdict(iv) for iv in intervals],
            "n_intervals": len(intervals),
            "fully_idle": idle_samples == len(numeric),
        }

    return {
        "period_minutes": period_t,
        "threshold_A": threshold,
        "min_duration_min": min_duration,
        "equipment": per_equipment,
    }


def print_report(report: dict) -> None:
    equipment = report["equipment"]
    period = report["period_minutes"]
    thr = report["threshold_A"]
    min_dur = report["min_duration_min"]

    print(f"[설정] threshold ≤ {thr} A, 최소 구간 길이 ≥ {min_dur} 분, 기간 {period:.0f} 분")
    print()

    fully = sorted([k for k, v in equipment.items() if v["fully_idle"]])
    partials = [
        (k, v) for k, v in equipment.items()
        if not v["fully_idle"] and v["n_intervals"] > 0
    ]
    partials.sort(key=lambda kv: kv[1]["idle_ratio"], reverse=True)

    always_on = [
        k for k, v in equipment.items()
        if not v["fully_idle"] and v["n_intervals"] == 0
    ]

    print(f"=== 전체 기간 비가동 설비 ({len(fully)}대) ===")
    for name in fully:
        print(f"  - {name}")
    print()

    print(f"=== 부분 비가동 설비 ({len(partials)}대) ===")
    for name, info in partials:
        print(
            f"\n[{name}]  "
            f"비가동 {info['idle_ratio']*100:.1f}% "
            f"({info['idle_minutes_est']}분 / 구간 {info['n_intervals']}개)"
        )
        for iv in info["intervals"]:
            start_hhmm = iv["start"][11:16]
            end_hhmm = iv["end"][11:16]
            start_date = iv["start"][5:10]
            end_date = iv["end"][5:10]
            if start_date == end_date:
                span = f"{start_date} {start_hhmm}~{end_hhmm}"
            else:
                span = f"{start_date} {start_hhmm} ~ {end_date} {end_hhmm}"
            print(f"    · {span}  ({iv['duration_min']:.0f}분)")

    print()
    print(f"=== 상시 가동 설비 ({len(always_on)}대, 비가동 구간 없음) ===")
    for name in always_on:
        print(f"  - {name}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--threshold", type=float, default=0.1,
                    help="이 값 이하면 비가동으로 판정 (A, 기본 0.1)")
    ap.add_argument("--min-duration", type=float, default=5.0,
                    help="최소 비가동 구간 길이 (분, 기본 5)")
    ap.add_argument("--data", type=Path, default=DATA_PATH)
    ap.add_argument("--output", type=Path, default=None,
                    help="구조화된 결과를 JSON으로 저장")
    args = ap.parse_args()

    with args.data.open("r", encoding="utf-8") as f:
        records = json.load(f)

    report = analyze(records, args.threshold, args.min_duration)
    print_report(report)

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        with args.output.open("w", encoding="utf-8") as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        print(f"\n[저장] {args.output}")


if __name__ == "__main__":
    main()
