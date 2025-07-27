from django.db import models

class UploadedFile(models.Model):
    file = models.FileField(upload_to="uploads/")
    original_filename = models.CharField(max_length=255)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return self.original_filename