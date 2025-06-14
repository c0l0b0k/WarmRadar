from rest_framework import serializers


class MaterialClassificationResultSerializer(serializers.Serializer):
    """
    Результат классификации материала (по минимальной ошибке).
    """
    material_type = serializers.CharField()
    error = serializers.FloatField()


from rest_framework import serializers
from analysis.models import UploadedFile

class UploadedFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedFile
        fields = ["id", "file", "original_filename", "uploaded_at"]
        read_only_fields = ["original_filename", "uploaded_at"]

    def create(self, validated_data):
        print(validated_data)
        validated_data["original_filename"] = validated_data["file"].name
        return super().create(validated_data)


from rest_framework import serializers

class PlotParamsSerializer(serializers.Serializer):
    pk = serializers.IntegerField()
    smooth_window = serializers.IntegerField(required=False, default=11)
    smooth_poly = serializers.IntegerField(required=False, default=3)

    show_raw = serializers.BooleanField(default=False)
    show_smooth = serializers.BooleanField(default=True)
    show_deriv1 = serializers.BooleanField(default=True)
    show_deriv2 = serializers.BooleanField(default=True)
    show_points = serializers.BooleanField(default=True)
    show_segments = serializers.BooleanField(default=True)
    show_main_lines = serializers.BooleanField(default=True)
    show_main_areas=serializers.BooleanField(default=True)

    show_tga = serializers.BooleanField(default=True)
    show_d1_tga = serializers.BooleanField(default=True)
    show_d2_tga = serializers.BooleanField(default=True)
