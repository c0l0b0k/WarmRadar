from django.urls import path
from analysis.views import UploadFileView
from analysis.views import ClassifyMaterialView



from analysis.views import UploadFileView, ClassifyMaterialView, PlotView, recalculate_main_lines

urlpatterns = [
    path("upload/", UploadFileView.as_view(), name="upload-file"),
    path("file/<int:pk>/classify/", ClassifyMaterialView.as_view(), name="classify-file"),
    path("plot/", PlotView.as_view(), name="plot"),
    path("segments/by-points/", recalculate_main_lines),
]