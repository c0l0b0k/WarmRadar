import numpy as np
import pandas as pd
from thermal.services.data_loader import load_measurement_file


from .plot_utils import (
    detect_event_points_only,
    find_convex_segments,
    group_segments_by_overlap,
    build_main_lines_for_groups,
    calculate_main_areas,
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

    temperature = df[TEMP_COL].astype(float)
    dsc = df[DSC_COL].astype(float)
    tga = df[TGA_COL].astype(float) if TGA_COL in df else None

    points, dsc_smooth, d1_dsc, d2_dsc = detect_event_points_only(temperature, dsc, window=smooth_window, poly=smooth_poly)

    if tga is not None:
        d1_tga = np.gradient(tga, temperature)
        d2_tga = np.gradient(d1_tga, temperature)
    else:
        d1_tga = d2_tga = None

    segments = find_convex_segments(temperature, dsc, points)
    groups = group_segments_by_overlap(segments, temperature)
    main_lines = build_main_lines_for_groups(groups, temperature, dsc)
    main_areas = calculate_main_areas(main_lines, temperature, dsc)

    return {
        "temp": temperature,
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
        "main_areas": main_areas,
    }

def update_main_lines(pk: int, points: list[int] ):
    """
        Получает пользовательские точки и возвращает главные линии и площадь на основе оригинальных данных
    """
    print(f"pk {pk}")
    df = load_measurement_file(pk)

    temperature = df[TEMP_COL].astype(float)
    dsc = df[DSC_COL].astype(float)

    # Ищем ближайшие индексы
    indexes = []
    for pt in points:
        x, y = pt["x"], pt["y"]
        idx = np.argmin(np.abs(temperature - x))
        indexes.append(idx)
    print(indexes)
    # Генерируем сегменты
    segments = find_convex_segments(temperature, dsc, indexes)
    groups = group_segments_by_overlap(segments, temperature)
    main_lines = build_main_lines_for_groups(groups, temperature, dsc)
    main_areas = calculate_main_areas(main_lines, temperature, dsc)
    result = [
        {
            "x1": float(temperature.iloc[idx1]),
            "y1": float(dsc.iloc[idx1]),
            "x2": float(temperature.iloc[idx2]),
            "y2": float(dsc.iloc[idx2]),
            "area": main_areas[i]["area"],  # <-- добавляем площадь
            "polyline": main_areas[i]["polyline"],  # ←  добавляем контур
        }
        for i, (idx1, idx2) in enumerate(main_lines)
    ]

    return result