def handler(request):
    """Minimal test handler to verify Vercel can invoke functions"""
    return {
        "statusCode": 200,
        "body": '{"test": "working"}'
    }
