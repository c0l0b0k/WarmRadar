#возможно удалить
import io
from typing import List
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from thermal.services.event_detector import detect_events
from thermal.services.data_loader import load_measurement_file

TEMP_COL = "Temp./°C"
DSC_COL = "DSC/(uV/mg)"
TGA_COL = "Mass/%"


def generate_plot_image(pk: int, show: List[str], config: dict = None) -> bytes:
    df = load_measurement_file(pk)
    temp = df[TEMP_COL].astype(float)

    fig, ax_dsc = plt.subplots(figsize=(10, 6))

    ax_dict = {"dsc": ax_dsc}
    used_axes = [ax_dsc]
    colors = {
        "dsc": "tab:blue",
        "tga": "tab:green",
        "d1_dsc": "orange",
        "d2_dsc": "red",
        "d1_tga": "purple",
        "d2_tga": "brown",
    }

    # --- Основные кривые ---
    if "dsc" in show and DSC_COL in df:
        dsc = df[DSC_COL].astype(float)
        ax_dsc.plot(temp, dsc, label="DSC (µV/mg)", color=colors["dsc"])
        ax_dsc.set_ylabel("DSC (µV/mg)", color=colors["dsc"])
        ax_dsc.tick_params(axis='y', labelcolor=colors["dsc"])
    else:
        dsc = None

    if "tga" in show and TGA_COL in df:
        tga = df[TGA_COL].astype(float)
        ax_tga = ax_dsc.twinx()
        used_axes.append(ax_tga)
        ax_dict["tga"] = ax_tga
        ax_tga.plot(temp, tga, label="Mass %", color=colors["tga"])
        ax_tga.set_ylabel("Mass, %", color=colors["tga"])
        ax_tga.tick_params(axis='y', labelcolor=colors["tga"])

    # --- Производные ---
    def add_derivative(col_name: str, deriv_label: str, curve, ax_base, pos=1):
        if curve is None:
            return
        d = np.gradient(curve, temp)
        if col_name.startswith("d2_"):
            d = np.gradient(d, temp)
        ax_deriv = ax_base if col_name in ax_dict else ax_base.twinx()
        if col_name not in ax_dict:
            ax_deriv.spines["right"].set_position(("axes", 1 + 0.1 * pos))
            used_axes.append(ax_deriv)
            ax_dict[col_name] = ax_deriv
        ax_deriv.plot(temp, d / np.max(np.abs(d)), label=deriv_label, color=colors[col_name], linestyle="--" if "d1" in col_name else ":")
        ax_deriv.set_ylabel(deriv_label, color=colors[col_name])
        ax_deriv.tick_params(axis='y', labelcolor=colors[col_name])

    i = 1
    for name in ["d1_dsc", "d2_dsc"]:
        if name in show and dsc is not None:
            add_derivative(name, name.upper().replace("_", "(") + ")", dsc, ax_dsc, i)
            i += 1
    for name in ["d1_tga", "d2_tga"]:
        if name in show and TGA_COL in df:
            curve = df[TGA_COL].astype(float)
            add_derivative(name, name.upper().replace("_", "(") + ")", curve, ax_dsc, i)
            i += 1

    # --- События ---
    if "events" in show and dsc is not None:
        result = detect_events(temp, dsc)
        for idx, (start, end) in enumerate(result["events"]):
            ax_dsc.axvspan(temp[start], temp[end], color='orange', alpha=0.3)
            ax_dsc.plot(temp[start], result["smoothed"][start], 'kx', label="Скачок DSC" if idx == 0 else "")

    # --- Общие настройки ---
    ax_dsc.set_xlabel("Temperature, °C")
    ax_dsc.grid(True)
    fig.suptitle(f"Файл №{pk}", fontsize=14)

    # --- Легенды для всех осей ---
    for ax in used_axes:
        handles, labels = ax.get_legend_handles_labels()
        if handles:
            ax.legend(loc="upper left")

    fig.tight_layout()
    buffer = io.BytesIO()
    fig.savefig(buffer, format="png", bbox_inches="tight")
    plt.close(fig)
    buffer.seek(0)
    return buffer.read()