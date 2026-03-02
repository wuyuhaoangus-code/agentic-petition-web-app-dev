from app.core.storage import SupabaseStorageGateway


class _FakeStorage:
    def __init__(self, payload):
        self._payload = payload

    def download(self, path):
        return self._payload

    def upload(self, **kwargs):
        return None

    def remove(self, paths):
        return None


class _FakeClient:
    def __init__(self, payload):
        self._payload = payload
        self.storage = self

    def from_(self, bucket):
        return _FakeStorage(self._payload)


def test_download_bytes_payload():
    gw = SupabaseStorageGateway(client=_FakeClient(b"bytes"), bucket="x")
    assert gw.download("path") == b"bytes"


def test_download_data_attr_payload():
    class Payload:
        def __init__(self):
            self.data = b"payload"

    gw = SupabaseStorageGateway(client=_FakeClient(Payload()), bucket="x")
    assert gw.download("path") == b"payload"
