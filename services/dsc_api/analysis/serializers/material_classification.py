from rest_framework import serializers


class MaterialClassificationResultSerializer(serializers.Serializer):
    """
    Результат классификации материала (по минимальной ошибке).
    """
    material_type = serializers.CharField()
    error = serializers.FloatField()