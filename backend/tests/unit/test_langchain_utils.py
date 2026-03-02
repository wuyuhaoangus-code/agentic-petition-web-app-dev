from app.features.drafter.eb1a.langchain_utils import normalize_criteria_id, format_possessive_name


def test_normalize_criteria_id_aliases():
    assert normalize_criteria_id("press") == "published_material"
    assert normalize_criteria_id("published materials") == "published_material"


def test_format_possessive_name():
    assert format_possessive_name("James") == "James'"
    assert format_possessive_name("Alex") == "Alex's"
