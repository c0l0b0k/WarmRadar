from django.urls import path
from analysis.views import UploadFileView
from analysis.views import ClassifyMaterialView



from analysis.views import UploadFileView, ClassifyMaterialView, PlotView

urlpatterns = [
    path("upload/", UploadFileView.as_view(), name="upload-file"),
    path("file/<int:pk>/classify/", ClassifyMaterialView.as_view(), name="classify-file"),
    path("plot/", PlotView.as_view(), name="plot"),
]