class Message:
    def __init__(self, id: str, content: str, platform: str, timestamp: str):
        self.id = id
        self.content = content
        self.platform = platform
        self.timestamp = timestamp

    def to_dict(self):
        return {
            "id": self.id,
            "content": self.content,
            "platform": self.platform,
            "timestamp": self.timestamp,
        }