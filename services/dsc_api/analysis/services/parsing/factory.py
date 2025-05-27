from pathlib import Path
from .netzsch_parser import NetzschTxtParser
from .base_parser import BaseDataParser

PARSER_REGISTRY = {
    ".txt": NetzschTxtParser,
    #TODO добавить .csv парсер
}

def get_parser(path: Path, config: dict) -> BaseDataParser:
    """
    Возвращает парсер на основе расширения файла.
    """
    ext = path.suffix.lower()
    parser_cls = PARSER_REGISTRY.get(ext)
    if not parser_cls:
        raise ValueError(f"No parser registered for file extension: {ext}")
    return parser_cls(config)