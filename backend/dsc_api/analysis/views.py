import traceback

from analysis.serializers import UploadedFileSerializer
import numpy as np
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from pathlib import Path
from django.conf import settings
from analysis.models import UploadedFile
from analysis.services.material_classifier import classify_sample
from analysis.serializers import MaterialClassificationResultSerializer
from django.http import HttpResponse
import matplotlib
matplotlib.use("Agg")  # <--- Это отключает GUI
import matplotlib.pyplot as plt
import io

from analysis.services.parsing.factory import get_parser

import numpy as np

class UploadFileView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = UploadedFileSerializer(data=request.data)
        if serializer.is_valid():
            file_instance = serializer.save()
            return Response(UploadedFileSerializer(file_instance).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)



class ClassifyMaterialView(APIView):
    def post(self, request, pk: int, *args, **kwargs):
        try:
            uploaded_file = UploadedFile.objects.get(pk=pk)
            sample_path = Path(uploaded_file.file.path)
            ref_dir = Path(settings.BASE_DIR) / "analysis" / "resources" / "sample_materials"

            config = {
                "temp_column": "Temp./°C",
                "gas_columns": [
                    "QMID(s:1|m:16)/A",
                    "QMID(s:1|m:28)/A",
                    "QMID(s:1|m:44)/A",
                    "QMID(s:1|m:18)/A",
                    "QMID(s:1|m:2)/A",
                ],
                "interp_temp": np.arange(30, 1001, 1)
            }

            material, error = classify_sample(sample_path, ref_dir, config)
            result = {"material_type": material, "error": error}
            return Response(MaterialClassificationResultSerializer(result).data)

        except UploadedFile.DoesNotExist:
            return Response({"detail": "File not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


# class PlotFileView(APIView):
#     def get(self, request, pk):
#         show_first = request.query_params.get("first_deriv") == "true"
#         show_second = request.query_params.get("second_deriv") == "true"
#
#         try:
#             file = UploadedFile.objects.get(pk=pk)
#         except UploadedFile.DoesNotExist:
#             return Response({"detail": "Файл не найден"}, status=status.HTTP_404_NOT_FOUND)
#
#         config = {
#             "temp_column": "Temp./°C",
#             "gas_columns": [
#                 "QMID(s:1|m:16)/A",
#                 "QMID(s:1|m:28)/A",
#                 "QMID(s:1|m:44)/A",
#                 "QMID(s:1|m:18)/A",
#                 "QMID(s:1|m:2)/A",
#             ],
#             "interp_temp": np.arange(30, 1001, 1),
#         }
#
#         parser = get_parser(Path(file.file.path), config)
#         df = parser.read(file.file.path)
#
#         fig, ax = plt.subplots(figsize=(10, 5))
#
#         temp = df[config["temp_column"]]
#         for col in config["gas_columns"]:
#             y = df[col]
#             ax.plot(temp, y, label=col)
#
#             if show_first:
#                 dy1 = np.gradient(y, temp)
#                 ax.plot(temp, dy1, "--", label=f"{col} (1')")
#             if show_second:
#                 dy2 = np.gradient(np.gradient(y, temp), temp)
#                 ax.plot(temp, dy2, ":", label=f"{col} (2')")
#
#         ax.set_xlabel("Температура (°C)")
#         ax.set_ylabel("Интенсивность")
#         ax.legend(loc="upper right")
#         ax.grid(True)
#
#         # Вывод в байты
#         buffer = io.BytesIO()
#         plt.tight_layout()
#         plt.savefig(buffer, format="png")
#         plt.close(fig)
#         buffer.seek(0)
#
#         return HttpResponse(buffer.getvalue(), content_type="image/png")

# from django.http import HttpResponse, JsonResponse
# from rest_framework.views import APIView
# from analysis.services.plot_generator import generate_plot_image
#
# class PlotView(APIView):
#     def get(self, request, pk: int):
#         show = request.GET.get("show", "dsc").split(",")
#
#         try:
#             image_bytes = generate_plot_image(pk, show=show)
#             return HttpResponse(image_bytes, content_type="image/png")
#         except FileNotFoundError:
#             return JsonResponse({"error": "Файл не найден"}, status=404)
#         except Exception as e:
#             traceback.print_exc()
#             return JsonResponse({"error": str(e)}, status=500)


from .serializers import PlotParamsSerializer
import plotly.graph_objects as go
from analysis.services.plot_utils import create_plotly_figure
from analysis.services.analyze_dsc import update_main_lines
from rest_framework.decorators import api_view



class PlotView(APIView):
    def post(self, request):
        serializer = PlotParamsSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        print(serializer.validated_data)
        fig = create_plotly_figure(**serializer.validated_data)
        return Response(fig.to_dict(), status=status.HTTP_200_OK)


@api_view(["POST"])
def recalculate_main_lines(request):
    """
    Получает пользовательские точки и возвращает главные линии на основе оригинальных данных
    """
    points = request.data.get("points", [])
    pk = request.data.get("pk")
    if not pk or not points:
        return Response({"error": "Missing points or pk"}, status=400)
    print(f"points {points}")
    main_lines = update_main_lines(pk,points)
    print(f"main_lines {main_lines}")
    return Response(main_lines)