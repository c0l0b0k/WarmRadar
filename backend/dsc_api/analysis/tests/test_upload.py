# analysis/tests/test_upload.py
from rest_framework.test import APIClient
from django.urls import reverse
from django.core.files.uploadedfile import SimpleUploadedFile
import pytest

@pytest.mark.django_db
def test_upload_file_success():
    client = APIClient()
    file_data = SimpleUploadedFile("test.txt", b"Sample data content", content_type="text/plain")
    response = client.post(reverse("upload-file"), {"file": file_data}, format="multipart")
    assert response.status_code == 201
    assert "id" in response.data