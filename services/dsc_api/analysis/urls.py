from django.urls import path
from analysis.views.upload_view import UploadFileView

urlpatterns = [
    path("upload/", UploadFileView.as_view(), name="upload-file"),
]
