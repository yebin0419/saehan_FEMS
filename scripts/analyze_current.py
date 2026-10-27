"""EMS 전류 소비 분석 스크립트.

legacy/ems_20261013.json 을 읽어 각 설비의 전류 소비 통계를 계산한다.
"""
from __future__ import annotations

import json
import statistics
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA_PATH = HERE.parent / "legacy" / "ems_20261013.json"
META_FIELDS = {"index", "time"}


def load_records(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def summarize(records: list[dict]) -> list[dict]:
    equipment_fields = [k for k in records[0].keys() if k not in META_FIELDS]

    summaries: list[dict] = []
    for field in equipment_fields:
        values = [row[field] for row in records if isinstance(row.get(field), (int, float))]
        if not values:
            continue
        nonzero = [v for v in values if v > 0]
        summaries.append(
            {
                "equipment": field,
                "samples": len(values),
                "mean_all": statistics.fmean(values),
                "mean_running": statistics.fmean(nonzero) if nonzero else 0.0,
                "running_ratio": len(nonzero) / len(values),
                "max": max(values),
                "min": min(values),
                "stdev": statistics.pstdev(values),
            }
        )
    return summaries


def main() -> None:
    records = load_records(DATA_PATH)
    print(f"[기간] {records[0]['time']} ~ {records[-1]['time']}")
    print(f"[레코드 수] {len(records):,} (약 1분 샘플링)")
    print()

    summaries = summarize(records)
    summaries.sort(key=lambda s: s["mean_all"], reverse=True)

    header = (
        f"{'순위':>3} {'설비명':<28} {'전체 평균(A)':>12} "
        f"{'가동시 평균(A)':>14} {'가동률':>8} {'최대(A)':>9} {'표준편차':>9}"
    )
    print(header)
    print("-" * len(header))
    for rank, s in enumerate(summaries, 1):
        print(
            f"{rank:>3} {s['equipment']:<28} "
            f"{s['mean_all']:>12.2f} "
            f"{s['mean_running']:>14.2f} "
            f"{s['running_ratio']*100:>7.1f}% "
            f"{s['max']:>9.2f} "
            f"{s['stdev']:>9.2f}"
        )

    top = summaries[0]
    total_mean = sum(s["mean_all"] for s in summaries)
    print()
    print("=== 핵심 결론 ===")
    print(
        f"- 전체 평균 소비가 가장 높은 설비: {top['equipment']} "
        f"(평균 {top['mean_all']:.2f} A, 가동시 평균 {top['mean_running']:.2f} A, "
        f"가동률 {top['running_ratio']*100:.1f}%)"
    )
    print(f"- 전 설비 평균 전류 합계: {total_mean:.2f} A")
    print(f"- 설비 수: {len(summaries)} 대")


if __name__ == "__main__":
    main()
