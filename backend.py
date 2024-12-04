from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import subprocess
import os
import json
from datetime import datetime
import glob
from werkzeug.utils import secure_filename

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration for file uploads and directories
BASE_DIR = os.path.abspath(os.path.dirname(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
REVIEWS_FOLDER = os.path.join(BASE_DIR, 'data', 'reviews')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

# Create necessary directories
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(REVIEWS_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size


# Helper Functions

def extract_college_and_intent(user_message):
    """
    Extracts the college name and checks if the query is about a review.
    """
    review_keywords = ["review", "feedback", "opinion", "rating"]
    college_name = None
    is_review_query = False

    # Split the message into words for processing
    words = user_message.lower().split()

    # Check if the query is about a review
    is_review_query = any(keyword in words for keyword in review_keywords)

    # Look for a college name based on a simple heuristic
    if "college" in words:
        index = words.index("college")
        if index > 0:  # Ensure there's a preceding word
            college_name = " ".join(words[max(0, index - 1):index + 1]).title()

    return college_name, is_review_query


def search_college_by_name(folder, college_name_query):
    """
    Searches JSON files in a folder for reviews matching the college name.
    """
    results = []
    college_name_query_lower = college_name_query.lower()
    
    for file_path in glob.glob(os.path.join(folder, "*.json")):
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
                if college_name_query_lower in data.get('name', '').lower():
                    results.append(data)
        except Exception as e:
            print(f"Error reading {file_path}: {e}")
    
    return results


# Chatbot response handler using the Gemma model
def get_response_from_gemma(user_message):
    try:
        # Run the Gemma model using the Ollama CLI with a prompt
        result = subprocess.run(
            ["/snap/bin/ollama", "run", "gemma2", ":", "2b", user_message],
            capture_output=True,
            text=True,
            encoding="utf-8"  # Set encoding to utf-8 to handle special characters
        )
        
        # Check if the command was successful
        if result.returncode != 0:
            print(f"Error running Gemma: {result.stderr}")
            return f"Error: {result.stderr}"
        
        # Extract the response from the output
        return result.stdout.strip()
    
    except Exception as e:
        print(f"An error occurred: {e}")
        return f"An error occurred: {e}"


# Routes for chatbot functionality
@app.route("/")
def index():
    return render_template("chatbot.html")

@app.route("/collegeimage")
def college():
    return render_template("collegeimage.html")

@app.route("/user")
def uerlogo():
    return send_from_directory("static", "user.png")

@app.route("/chatbot")
def chatbotlogo():
    return send_from_directory("static", "chatbot.png")

@app.route("/chat", methods=["POST"])
def chat():
    user_message = request.json.get("message")
    if not user_message:
        return jsonify({"response": "No message received."}), 400

    # Extract college name and intent
    college_name, is_review_query = extract_college_and_intent(user_message)
    
    if is_review_query and college_name:
        # Path to the folder containing JSON files
        folder_path = REVIEWS_FOLDER
        
        # Search for the college review
        search_results = search_college_by_name(folder_path, college_name)
        
        if search_results:
            response_text = f"Found {len(search_results)} review(s):\n" + "\n".join(
                [f"College: {res['name']}\nReview: {res['review']}\nDate: {res['submission_date']}\n" for res in search_results]
            )
            return jsonify({"response": response_text})
        else:
            return jsonify({"response": f"No reviews found for {college_name}."})

    # Fallback to the Gemma model response
    bot_response = get_response_from_gemma(user_message)
    return jsonify({"response": bot_response})


# Routes for image and review functionality
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/upload', methods=['POST'])
def upload_images():
    if 'images' not in request.files:
        return jsonify({'error': 'No files provided'}), 400
    
    files = request.files.getlist('images')
    uploaded_files = []
    
    for file in files:
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
            new_filename = f"{timestamp}_{filename}"
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
            file.save(file_path)
            uploaded_files.append(new_filename)
    
    return jsonify({
        'message': 'Files uploaded successfully',
        'files': uploaded_files
    })

@app.route('/api/submit-review', methods=['POST'])
def submit_review():
    try:
        data = request.json
        
        if not data or 'name' not in data or 'review' not in data:
            return jsonify({'error': 'Missing required fields'}), 400
        
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        review_filename = f"review_{timestamp}.json"
        
        review_data = {
            'name': data['name'],
            'review': data['review'],
            'images': data.get('images', []),
            'timestamp': timestamp,
            'submission_date': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        review_path = os.path.join(REVIEWS_FOLDER, review_filename)
        with open(review_path, 'w', encoding='utf-8') as f:
            json.dump(review_data, f, indent=4, ensure_ascii=False)
        
        return jsonify({
            'message': 'Review submitted successfully',
            'review_id': review_filename
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/uploads/<filename>')
def serve_image(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/reviews', methods=['GET'])
def get_reviews():
    try:
        reviews = []
        for filename in os.listdir(REVIEWS_FOLDER):
            if filename.endswith('.json'):
                with open(os.path.join(REVIEWS_FOLDER, filename), 'r', encoding='utf-8') as f:
                    review = json.load(f)
                    reviews.append(review)
        return jsonify(reviews)
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True)


#host="0.0.0.0", port="8080",
