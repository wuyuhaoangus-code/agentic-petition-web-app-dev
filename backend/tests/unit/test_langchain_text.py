from app.features.drafter.eb1a.langchain_text import coerce_llm_text


def test_coerce_llm_text_string():
    assert coerce_llm_text("hello") == "hello"


def test_coerce_llm_text_list():
    assert coerce_llm_text(["", "first", "second"]) == "first\n\nsecond"


def test_coerce_llm_text_dict_paragraphs():
    data = {"paragraphs": ["one", "two"]}
    assert coerce_llm_text(data) == "one\n\n" + "two"
