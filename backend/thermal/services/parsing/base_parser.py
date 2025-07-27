from abc import ABC, abstractmethod
from pathlib import Path
import pandas as pd

class BaseDataParser(ABC):
    def __init__(self, config: dict):
        self.config = config

    @abstractmethod
    def read(self, path: Path) -> pd.DataFrame:
        """
        Чтение и парсинг файла в pandas.DataFrame
        """
        pass