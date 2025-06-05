import io
import os
import pandas as pd
import matplotlib.pyplot as plt
import pandas as pd
import matplotlib.pyplot as plt
import numpy as np
from scipy.signal import savgol_filter, find_peaks


DATA_PATH = "data/data_piroliz_10"

# Названия столбцов в данных
TEMP_COL = "Temp./°C"
DSC_COL = "DSC/(uV/mg)"
TGA_COL = "Mass/%"




from typing import List, Tuple

def detect_event_points_only(
    temp: pd.Series,
    dsc: pd.Series,
    window=6,
    poly=3,
    min_temp=180,
    threshold=0.001,
    exclusion_range=30
):
    if window and poly:
        dsc_smooth = savgol_filter(dsc, window, poly)
        d1 = savgol_filter(dsc, window, poly, deriv=1)
        d2 = savgol_filter(dsc, window, poly, deriv=2)
    else:
        dsc_smooth = dsc.copy()
        d1 = np.gradient(dsc, temp)
        d2 = np.gradient(d1, temp)

    points = []

    # 1. Основные точки — пересечения нуля второй производной
    for i in range(1, len(d2)):
        if temp.iloc[i] < min_temp:
            continue
        if d2[i - 1] * d2[i] < 0:
            points.append(i)

    # 2. Дополнительные точки
    for i in range(1, len(d2) - 1):
        t = temp.iloc[i]
        if t < min_temp or abs(d2[i]) >= threshold:
            continue
        if any(abs(t - temp.iloc[j]) < exclusion_range for j in points):
            continue
        points.append(i)

    # 3. Закрытие последнего пика, если нужно
    peak_idx = dsc[temp > min_temp].idxmax()
    has_right = any(i > peak_idx for i in points)

    if not has_right:
        right_part = d2[peak_idx + 1:]
        if right_part.size > 0:
            max_d2_idx = peak_idx + 1 + np.argmax(right_part)
            points.append(max_d2_idx)

    # Упорядочим по температуре
    points = sorted(points, key=lambda i: temp.iloc[i])

    return points, dsc_smooth, d1, d2

def find_convex_segments(temp: pd.Series, dsc: np.ndarray, points: list[int], max_temp_span=450):
    """
    Возвращает отрезки, соединяющие пары точек, между которыми весь DSC выше прямой,
    и разность температур не превышает max_temp_span.
    """
    segments = []

    for i in range(len(points)):
        for j in range(i + 1, len(points)):
            idx1, idx2 = points[i], points[j]
            t1, t2 = temp.iloc[idx1], temp.iloc[idx2]

            # Ограничение по температуре
            if abs(t2 - t1) > max_temp_span:
                continue

            y1, y2 = dsc[idx1], dsc[idx2]
            slope = (y2 - y1) / (t2 - t1)
            intercept = y1 - slope * t1

            valid = True
            for k in range(idx1 + 1, idx2):
                y_line = slope * temp.iloc[k] + intercept
                if dsc[k] < y_line:
                    valid = False
                    break

            if valid:
                segments.append((idx1, idx2))

    return segments

from collections import defaultdict

def group_segments_by_overlap(segments, temp, overlap_eps=10):
    """
    Группирует отрезки (idx1, idx2) по пересечению по температуре.
    Возвращает список групп: каждая группа — список отрезков.
    """
    # 1. Создаём список температурных интервалов
    intervals = [
        (i, min(temp.iloc[s[0]], temp.iloc[s[1]]), max(temp.iloc[s[0]], temp.iloc[s[1]]))
        for i, s in enumerate(segments)
    ]

    # 2. Строим граф по пересечению интервалов
    graph = defaultdict(set)
    for i, start1, end1 in intervals:
        for j, start2, end2 in intervals:
            if i == j:
                continue
            # проверка перекрытия с допуском
            if min(end1, end2) - max(start1, start2) >= -overlap_eps:
                graph[i].add(j)
                graph[j].add(i)

    # 3. Поиск компонент связности (классика)
    visited = set()
    groups = []

    def dfs(node, group):
        visited.add(node)
        group.append(segments[node])
        for neighbor in graph[node]:
            if neighbor not in visited:
                dfs(neighbor, group)

    for i in range(len(segments)):
        if i not in visited:
            group = []
            dfs(i, group)
            groups.append(group)

    return groups

# def select_representative_segments(groups, temp):
#     """
#     Выбирает по одной (главной) линии из каждой группы — самую длинную по температуре.
#     """
#     result = []
#     for group in groups:
#         best = max(group, key=lambda s: abs(temp.iloc[s[1]] - temp.iloc[s[0]]))
#         result.append(best)
#     return result

def build_main_lines_for_groups(groups: list[list[tuple[int, int]]], temp: pd.Series, dsc: np.ndarray):
    """
    Для каждой группы строит "главную линию" — отрезок между двумя точками с максимальной температурной разницей.
    Возвращает список пар индексов (idx1, idx2).
    """
    main_lines = []

    for group in groups:
        point_set = set()
        for idx1, idx2 in group:
            point_set.add(idx1)
            point_set.add(idx2)
        point_list = sorted(point_set, key=lambda i: temp.iloc[i])

        if len(point_list) >= 2:
            idx1 = point_list[0]
            idx2 = point_list[-1]
            main_lines.append((idx1, idx2))

    return main_lines


import plotly.graph_objects as go
from analysis.services.analyze_dsc import load_and_analyze

def create_plotly_figure(
    pk,
    smooth_window,
    smooth_poly,
    show_raw,
    show_smooth,
    show_deriv1,
    show_deriv2,
    show_points,
    show_segments, #Нужно ли?
    show_events_line,
    show_tga,
    show_d1_tga,
    show_d2_tga,
):
    data = load_and_analyze(pk, smooth_window, smooth_poly)
    temp = data["temp"]

    fig = go.Figure()

    # ======= Основные линии =======
    if show_raw:
        fig.add_trace(go.Scatter(
            x=temp, y=data["dsc"], name="ДСК",
            line=dict(color="gray"), yaxis="y"
        ))
    if show_smooth:
        fig.add_trace(go.Scatter(
            x=temp, y=data["dsc_smooth"], name="ДСК (сглаж)",
            line=dict(color="blue", width=2), yaxis="y",meta={"id": "dsc_smooth"}
        ))

    # ======= Производные DSC =======
    if show_deriv1:
        fig.add_trace(go.Scatter(
            x=temp, y=data["d1_dsc"], name="d1(ДСК)",
            line=dict(color="red", dash="dash"), yaxis="y3"
        ))
    if show_deriv2:
        fig.add_trace(go.Scatter(
            x=temp, y=data["d2_dsc"], name="d2(ДСК)",
            line=dict(color="brown", dash="dot"), yaxis="y3"
        ))

    # ======= TGA =======
    if show_tga and data["tga"] is not None:
        fig.add_trace(go.Scatter(
            x=temp, y=data["tga"], name="ТГА",
            line=dict(color="green", width=2), yaxis="y2",
            visible='legendonly'
        ))
    if show_d1_tga and data["d1_tga"] is not None:
        fig.add_trace(go.Scatter(
            x=temp, y=data["d1_tga"], name="d1(ТГА)",
            line=dict(color="purple", dash="dash"), yaxis="y3",
            visible='legendonly'
        ))
    if show_d2_tga and data["d2_tga"] is not None:
        fig.add_trace(go.Scatter(
            x=temp, y=data["d2_tga"], name="d2(ТГА)",
            line=dict(color="orange", dash="dot"), yaxis="y3",
            visible='legendonly'
        ))

    # ======= Точки событий =======
    if show_points:
        fig.add_trace(go.Scatter(
            x=temp[data["points"]],
            y=data["dsc_smooth"][data["points"]],
            mode='markers+text',
            name='Точки',
            marker=dict(color='red', size=10),
            text=[f'P{i+1}' for i in range(len(data["points"]))],
            textposition='top center',
            yaxis="y",
            meta={"id": "points"}
        ))

    # ======= Жёлтые отрезки =======
    if show_segments:
        for idx1, idx2 in data["segments"]:
            fig.add_trace(go.Scatter(
                x=[temp.iloc[idx1], temp.iloc[idx2]],
                y=[data["dsc"][idx1], data["dsc"][idx2]],
                mode='lines',
                line=dict(color='gold', width=2),
                showlegend=False,
                yaxis="y"
            ))

    # ======= Главные линии (чёрные) =======
    if show_events_line:
        x_lines = []
        y_lines = []

        for idx1, idx2 in data["main_lines"]:
            x_lines.extend([temp.iloc[idx1], temp.iloc[idx2], None])
            y_lines.extend([data["dsc"][idx1], data["dsc"][idx2], None])

        fig.add_trace(go.Scatter(
            x=x_lines,
            y=y_lines,
            mode='lines',
            line=dict(color='black', width=3),
            name='Сегменты',
            yaxis='y',
            meta= {"id": "main_lines"},

        ))

    # ======= Layout с 3 осями =======
    fig.update_layout(
        xaxis=dict(
            title="Температура (°C)",
            domain=[0.3, 0.85]  # оставляем место слева и справа для осей
        ),

        # Левая внутренняя: DSC
        yaxis=dict(
            title=dict(text="ДСК (µV/mg)", font=dict(color="blue")),
            tickfont=dict(color="blue"),
            anchor="x",
            side="left"
        ),

        # Левая внешняя: производные
        yaxis2=dict(
            title=dict(text="Масса (%)", font=dict(color="green")),
            tickfont=dict(color="green"),
            anchor="free",
            overlaying="y",
            side="left",
            position=0.2  # 👈 чуть левее основной оси
        ),

        # Правая ось: TGA
        yaxis3=dict(
            title=dict(text="Производные", font=dict(color="red")),
            tickfont=dict(color="red"),
            anchor="free",
            overlaying="y",
            side="right",
            position=0.88  # 👈 немного правее от основной области
        ),

        legend=dict(
            orientation="v",
            yanchor="top",
            y=1,
            xanchor="left",
            x=0,
            font = dict(size=18),
        ),

        margin=dict(t=80, b=40),

    )
    return fig
