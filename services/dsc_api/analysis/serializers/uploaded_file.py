# analysis/serializers/uploaded_file.py
from rest_framework import serializers
from analysis.models.uploaded_file import UploadedFile

class UploadedFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UploadedFile
        fields = ["id", "file", "original_filename", "uploaded_at"]
        read_only_fields = ["original_filename", "uploaded_at"]

    def create(self, validated_data):
        validated_data["original_filename"] = validated_data["file"].name
        return super().create(validated_data)