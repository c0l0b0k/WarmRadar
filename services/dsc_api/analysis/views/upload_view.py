# analysis/views/upload_view.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from analysis.serializers.uploaded_file import UploadedFileSerializer

class UploadFileView(APIView):
    def post(self, request, *args, **kwargs):
        serializer = UploadedFileSerializer(data=request.data)
        if serializer.is_valid():
            file_instance = serializer.save()
            return Response(UploadedFileSerializer(file_instance).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
