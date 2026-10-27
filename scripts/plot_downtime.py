"""비가동 구간 시각화.

detect_downtime.py 가 저장한 JSON을 읽어 Gantt 차트와 비가동률 바 차트를 그린다.
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path

import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from matplotlib import rcParams

HERE = Path(__file__).resolve().parent
DEFAULT_INPUT = HERE.parent / "out" / "downtime_20261013.json"
DEFAULT_OUTPUT = HERE.parent / "out" / "downtime_20261013.png"


def configure_korean_font() -> None:
    for family in ("Malgun Gothic", "AppleGothic", "NanumGothic", "DejaVu Sans"):
        try:
            rcParams["font.family"] = family
            break
        except Exception:
            continue
    rcParams["axes.unicode_minus"] = False


def parse_iso(s: str) -> datetime:
    return datetime.fromisoformat(s)


def plot(report: dict, output: Path) -> None:
    equipment = report["equipment"]

    # 비가동률 기준으로 정렬 (높은 쪽이 위)
    rows = sorted(equipment.items(), key=lambda kv: kv[1]["idle_ratio"])
    names = [k for k, _ in rows]
    ratios = [v["idle_ratio"] for _, v in rows]

    # 전체 분석 기간 범위
    all_starts, all_ends = [], []
    for _, info in rows:
        for iv in info["intervals"]:
            all_starts.append(parse_iso(iv["start"]))
            all_ends.append(parse_iso(iv["end"]))
    if not all_starts:
        print("비가동 구간이 없습니다.")
        return
    t_min, t_max = min(all_starts), max(all_ends)

    fig, (ax_g, ax_b) = plt.subplots(
        1, 2, figsize=(16, 10),
        gridspec_kw={"width_ratios": [3.2, 1]},
        sharey=True,
    )

    # ---- Gantt 차트 ----
    for y, (name, info) in enumerate(rows):
        color = "#c0392b" if info["fully_idle"] else "#e67e22"
        bars = []
        for iv in info["intervals"]:
            start = mdates.date2num(parse_iso(iv["start"]))
            end = mdates.date2num(parse_iso(iv["end"]))
            width = end - start
            if width > 0:
                bars.append((start, width))
        if bars:
            ax_g.broken_barh(bars, (y - 0.4, 0.8), facecolors=color, alpha=0.85)

    ax_g.set_yticks(range(len(names)))
    ax_g.set_yticklabels(names, fontsize=9)
    ax_g.set_xlim(mdates.date2num(t_min), mdates.date2num(t_max))
    ax_g.xaxis.set_major_locator(mdates.HourLocator(interval=2))
    ax_g.xaxis.set_major_formatter(mdates.DateFormatter("%m-%d\n%H:%M"))
    ax_g.set_xlabel("시각")
    ax_g.set_title(
        f"설비별 비가동 구간 (threshold ≤ {report['threshold_A']} A, "
        f"min_duration ≥ {report['min_duration_min']:.0f} 분)",
        fontsize=12,
    )
    ax_g.grid(axis="x", linestyle=":", alpha=0.5)
    ax_g.set_axisbelow(True)

    # 범례
    from matplotlib.patches import Patch
    ax_g.legend(
        handles=[
            Patch(facecolor="#c0392b", label="전체 기간 비가동"),
            Patch(facecolor="#e67e22", label="부분 비가동"),
        ],
        loc="lower right",
        fontsize=9,
    )

    # ---- 비가동률 바 차트 ----
    bar_colors = [
        "#c0392b" if info["fully_idle"] else "#e67e22" if info["n_intervals"] > 0 else "#2ecc71"
        for _, info in rows
    ]
    ax_b.barh(range(len(names)), [r * 100 for r in ratios], color=bar_colors, alpha=0.85)
    ax_b.set_xlim(0, 100)
    ax_b.set_xlabel("비가동 비율 (%)")
    ax_b.set_title("비가동률", fontsize=12)
    ax_b.grid(axis="x", linestyle=":", alpha=0.5)
    ax_b.set_axisbelow(True)
    for y, r in enumerate(ratios):
        if r > 0:
            ax_b.text(min(r * 100 + 1.5, 95), y, f"{r*100:.1f}%", va="center", fontsize=8)

    fig.suptitle(
        f"EMS 비가동 분석 ({report['period_minutes']:.0f}분 구간)",
        fontsize=14, fontweight="bold",
    )
    fig.tight_layout(rect=(0, 0, 1, 0.97))

    output.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output, dpi=130, bbox_inches="tight")
    print(f"[저장] {output}")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    ap.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = ap.parse_args()

    configure_korean_font()
    with args.input.open("r", encoding="utf-8") as f:
        report = json.load(f)
    plot(report, args.output)


if __name__ == "__main__":
    main()
