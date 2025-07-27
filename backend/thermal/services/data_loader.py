from pathlib import Path
import pandas as pd
from thermal.models import UploadedFile
from thermal.services.parsing.factory import  get_parser

def load_measurement_file(pk: int) -> pd.DataFrame:
    instance = UploadedFile.objects.get(pk=pk)
    path = Path(instance.file.path)
    parser = get_parser(path, config={})
    return parser.read(path)