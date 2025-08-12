import os
import certifi
import openai

# Set SSL cert file for Windows/Python SSL issues
os.environ["SSL_CERT_FILE"] = certifi.where()

# Read API key from environment
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    print("OPENAI_API_KEY not set in environment.")
    exit(1)

client = openai.OpenAI(api_key=api_key)

prompt = "A 3D render of a virtual room featuring sunglasses and a laptop on a beach"

try:
    response = client.images.generate(
        model="dall-e-2",
        prompt=prompt,
        n=1,
        size="512x512"
    )
    image_url = response.data[0].url
    print(f"Image URL: {image_url}")
except Exception as e:
    print(f"Error: {e}") 