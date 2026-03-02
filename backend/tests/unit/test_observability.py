from app.core.observability import log_event


class _Logger:
    def __init__(self):
        self.messages = []

    def info(self, msg):
        self.messages.append(msg)


def test_log_event_json():
    logger = _Logger()
    log_event(logger, "event_name", foo="bar", value=123)
    assert logger.messages
    assert "event_name" in logger.messages[0]
