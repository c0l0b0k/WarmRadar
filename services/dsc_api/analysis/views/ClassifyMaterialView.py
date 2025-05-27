import numpy as np
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from pathlib import Path
from django.conf import settings

from analysis.models.uploaded_file import UploadedFile
from analysis.services.material_classifier import classify_sample
from analysis.serializers.material_classification import MaterialClassificationResultSerializer


class ClassifyMaterialView(APIView):
    def post(self, request, pk: int, *args, **kwargs):
        try:
            uploaded_file = UploadedFile.objects.get(pk=pk)
            print(uploaded_file.file.name)  # путь относительно MEDIA_ROOT
            print(uploaded_file.file.path)  # абсолютный путь

            print(uploaded_file.original_filename)

            print(Path(uploaded_file.file.path).suffix)  # расширение
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