from django.urls import path
from analysis.views.upload_view import UploadFileView
from analysis.views.ClassifyMaterialView import ClassifyMaterialView

urlpatterns = [
    path("upload/", UploadFileView.as_view(), name="upload-file"),
    path("file/<int:pk>/classify/", ClassifyMaterialView.as_view(), name="classify-file"),
]
