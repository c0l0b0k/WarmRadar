import numpy as np
import pandas as pd
from analysis.services.data_loader import load_measurement_file


from .plot_utils import (
    detect_event_points_only,
    find_convex_segments,
    group_segments_by_overlap,
    build_main_lines_for_groups,
    TEMP_COL,
    DSC_COL,
    DATA_PATH,
    TGA_COL,
)

def load_and_analyze(pk: int, smooth_window: int, smooth_poly: int):
    """
    Загружает и анализирует файл, возвращает все данные, нужные для построения графика.
    """
    df = load_measurement_file(pk)

    temp = df[TEMP_COL].astype(float)
    dsc = df[DSC_COL].astype(float)
    tga = df[TGA_COL].astype(float) if TGA_COL in df else None

    points, dsc_smooth, d1_dsc, d2_dsc = detect_event_points_only(temp, dsc, window=smooth_window, poly=smooth_poly)

    if tga is not None:
        d1_tga = np.gradient(tga, temp)
        d2_tga = np.gradient(d1_tga, temp)
    else:
        d1_tga = d2_tga = None

    segments = find_convex_segments(temp, dsc, points)
    groups = group_segments_by_overlap(segments, temp)
    main_lines = build_main_lines_for_groups(groups, temp, dsc)

    return {
        "temp": temp,
        "dsc": dsc,
        "dsc_smooth": dsc_smooth,
        "d1_dsc": d1_dsc,
        "d2_dsc": d2_dsc,
        "tga": tga,
        "d1_tga": d1_tga,
        "d2_tga": d2_tga,
        "points": points,
        "segments": segments,
        "main_lines": main_lines,
    }