from .base_parser import BaseDataParser
import pandas as pd
from pathlib import Path

class NetzschTxtParser(BaseDataParser):
    def read(self, path: Path) -> pd.DataFrame:
        """
        Универсальный парсер NETZSCH-подобных txt-файлов.
        - если есть строка с '##', использует её как начало заголовка
        - иначе — обычный csv-файл с заголовком на первой строке
        """
        with open(path, 'r', encoding='cp1251') as f:
            lines = f.readlines()

        # Поиск строки заголовка
        header_line = None
        for i, line in enumerate(lines):
            if line.startswith("##"):
                header_line = i
                break

        # Чтение файла
        if header_line is not None:
            df = pd.read_csv(
                path,
                sep=';',
                decimal=',',
                skiprows=header_line,
                encoding='cp1251',
                engine='python'
            )

            # Переименование первого столбца, удаляя префикс ##
            original_first_col = df.columns[0]
            if original_first_col.startswith("##"):
                df.rename(columns={original_first_col: original_first_col[2:]}, inplace=True)

        else:
            # Файл без заголовков типа # или ##
            df = pd.read_csv(
                path,
                sep=';',
                decimal=',',
                encoding='cp1251',
                engine='python'
            )

        return df