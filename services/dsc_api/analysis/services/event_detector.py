# Возможно удалить

import numpy as np
import pandas as pd
from scipy.signal import savgol_filter, find_peaks


TEMP_COL = "Temp./°C"
DSC_COL = "DSC/(uV/mg)"


def detect_events(
    temp: pd.Series,
    dsc: pd.Series,
    window: int = 11,
    poly: int = 3,
    threshold: float = 0.0005,
    min_temp: float = 120
):
    """
       Определяет события на кривой DSC по её первой и второй производным.

       Параметры:
       ----------
       temp : pd.Series
           Температура (ось X), числовой столбец, обычно из файла.
       dsc : pd.Series
           Значения DSC (ось Y), числовой столбец.
       window : int, optional
           Размер окна для сглаживания Savitzky-Golay фильтром. По умолчанию 11.
       poly : int, optional
           Порядок полинома для фильтра. По умолчанию 3.
       threshold : float, optional
           Порог чувствительности для второй производной при поиске событий. По умолчанию 0.0005.
       min_temp : float, optional
           Минимальная температура, ниже которой события игнорируются. По умолчанию 120°C.

       Возвращает:
       -----------
       dict:
           {
               "events": List[Tuple[int, int]],   # индексы начала и конца каждого события
               "smoothed": np.ndarray,            # сглаженная кривая DSC
               "d1": np.ndarray,                  # первая производная
               "d2": np.ndarray                   # вторая производная
           }

       Пример:
       -------
       result = detect_events(temp_series, dsc_series)
       for start_idx, end_idx in result["events"]:
           print(f"Event from {temp[start_idx]}°C to {temp[end_idx]}°C")
       """

    if window is None or poly is None:
        dsc_smooth = dsc.copy()
        d1 = np.gradient(dsc, temp)
        d2 = np.gradient(d1, temp)
    else:
        dsc_smooth = savgol_filter(dsc, window, poly)
        d1 = savgol_filter(dsc, window, poly, deriv=1)
        d2 = savgol_filter(dsc, window, poly, deriv=2)

    d2_norm = d2 / np.max(np.abs(d2))
    start_indices, _ = find_peaks(-d2_norm, height=threshold, distance=20)

    events = []
    for i, start in enumerate(start_indices):
        if temp.iloc[start] < min_temp:
            continue

        end = start + 1
        while end < len(d2_norm) - 1:
            if abs(d2_norm[end]) < 0.05:
                break
            end += 1

        early_start = start
        if temp.iloc[start] < 360 and len(events) == 0:
            while early_start > 1 and d2[early_start] < -threshold * 0.5:
                early_start -= 1
        else:
            while early_start > 5:
                if d2[early_start] > -threshold * 0.3 and d1[early_start] > 0:
                    break
                early_start -= 1
            while early_start > 5 and dsc_smooth[early_start] > dsc_smooth[early_start - 1]:
                early_start -= 1
            if temp.iloc[early_start] < min_temp:
                early_start = start

        if any(abs(early_start - prev_start) < 10 for prev_start, _ in events):
            continue

        if temp.iloc[end] - temp.iloc[early_start] < 25:
            continue

        events.append((early_start, end))

    return {
        "events": events,
        "smoothed": dsc_smooth,
        "d1": d1,
        "d2": d2
    }
