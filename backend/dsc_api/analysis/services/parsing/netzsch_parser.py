from .base_parser import BaseDataParser
import pandas as pd
from pathlib import Path


class NetzschTxtParser(BaseDataParser):
    def read(self, path: Path) -> pd.DataFrame:
        """
        Поддержка форматов:
        - с заголовком, начинающимся с ##
        - с строками (#) и последующим заголовком
        - без строк #
        """
        with open(path, 'r', encoding='cp1251') as f:
            lines = f.readlines()

        header_line = None
        for i, line in enumerate(lines):
            if line.startswith("##"):
                header_line = i
                break

        if header_line is not None:
            # Заголовок найден с ##
            df = pd.read_csv(
                path,
                sep=';',
                decimal=',',
                skiprows=header_line,
                encoding='cp1251',
                engine='python'
            )

            # Переименовываем первый столбец, убирая ##
            original_first_col = df.columns[0]
            if original_first_col.startswith("##"):
                df.rename(columns={original_first_col: original_first_col[2:]}, inplace=True)

        else:
            # Ищем первую непустую строку без "#"
            for i, line in enumerate(lines):
                line = line.strip()
                if line and not line.startswith("#"):
                    header_line = i
                    break

            df = pd.read_csv(
                path,
                sep=';',
                decimal=',',
                skiprows=header_line,
                encoding='cp1251',
                engine='python'
            )

        return df