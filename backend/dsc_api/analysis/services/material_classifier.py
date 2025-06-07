from pathlib import Path
from typing import Tuple

import numpy as np
import pandas as pd

from analysis.services.parsing.factory import get_parser


def interpolate_columns(
    df: pd.DataFrame,
    temp_col: str,
    target_cols: list[str],
    interp_temp: np.ndarray
) -> np.ndarray:
    """
    Интерполирует указанные столбцы по температурной шкале.

    :param df: датафрейм, считанный из файла
    :param temp_col: название столбца с температурой (например, "Temp./°C")
    :param target_cols: список колонок, которые нужно интерполировать
    :param interp_temp: массив температур, по которым делать интерполяцию
    :return: массив shape=(len(target_cols), len(interp_temp))
    """
    from scipy.interpolate import interp1d

    interpolated = []

    for col in target_cols:
        if col in df:
            x = df[temp_col]
            y = df[col]
            f = interp1d(x, y, bounds_error=False, fill_value=0)
            interpolated.append(f(interp_temp))
        else:
            interpolated.append(np.zeros_like(interp_temp))

    return np.array(interpolated)


def classify_sample(
    sample_path: Path,
    ref_dir: Path,
    config: dict
) -> Tuple[str, float]:
    """
    Классифицирует образец по MSE сравнению с эталонами.

    :param sample_path: путь к файлу с образцом
    :param ref_dir: директория с эталонными материалами
    :param config: словарь с параметрами: temp_column, gas_columns, interp_temp
    :return: (название материала, ошибка)
    """
    parser = get_parser(sample_path, config)
    sample_df = parser.read(sample_path)

    temp_col = config["temp_column"]
    gas_cols = config["gas_columns"]
    interp_temp = config.get("interp_temp", np.arange(30, 1001, 1))

    sample_vector = interpolate_columns(sample_df, temp_col, gas_cols, interp_temp)

    best_match: str = ""
    best_error: float = float("inf")

    for ref_file in ref_dir.glob("*.txt"):
        try:
            ref_parser = get_parser(ref_file, config)
            ref_df = ref_parser.read(ref_file)
            ref_vector = interpolate_columns(ref_df, temp_col, gas_cols, interp_temp)

            # Сравниваем по длине (если данные не совпадают)
            min_len = min(sample_vector.shape[1], ref_vector.shape[1])
            error = np.mean((sample_vector[:, :min_len] - ref_vector[:, :min_len]) ** 2)

            if error < best_error:
                best_match = ref_file.stem
                best_error = error

        except Exception:
            continue

    return best_match, best_error