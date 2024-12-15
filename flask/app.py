import os
from flask import Flask, request, jsonify, send_from_directory
from flask_restful import Resource, Api
from flask_cors import cross_origin
from flask_cors import CORS
from werkzeug.utils import secure_filename
import cv2
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use 'Agg' backend for non-interactive plotting
import matplotlib.pyplot as plt
from skimage.feature import local_binary_pattern

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
api = Api(app)

# Configure upload folder and visualization folder
UPLOAD_FOLDER = '../backend/express/src/uploads'
VISUALIZATION_FOLDER = 'visualizations'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)  # Create the folder if it doesn't exist
os.makedirs(VISUALIZATION_FOLDER, exist_ok=True)  # Folder for saving plots

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['VISUALIZATION_FOLDER'] = VISUALIZATION_FOLDER

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    """
    Check if the uploaded file has an allowed extension.
    """
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Visualization functions
def visualize_dominant_colors(dominant_colors, output_filename):
    colors = [dominant_colors[i:i+3] for i in range(0, len(dominant_colors), 3)]
    colors = [color[::-1] for color in colors]  # Convert BGR to RGB
    colors = [np.array(color) / 255.0 for color in colors]  # Normalize

    # Update figure size for a better aspect ratio
    plt.figure(figsize=(10, 6))  # Larger size with better height
    for i, color in enumerate(colors):
        plt.subplot(1, len(colors), i + 1)
        plt.imshow([[color]])
        plt.axis('off')
        plt.title(f"Color {i+1}", fontsize=14)  # Increase font size for better visibility

    plt.tight_layout()
    plt.savefig(output_filename, dpi=300)  # Higher resolution
    plt.close()


def visualize_color_histogram(image, output_filename):
    color = ('b', 'g', 'r')
    plt.figure(figsize=(8, 6))
    for i, col in enumerate(color):
        histogram = cv2.calcHist([image], [i], None, [256], [0, 256])
        plt.plot(histogram, color=col)
    plt.title("Color Histogram")
    plt.xlabel("Bins")
    plt.ylabel("Frequency")
    plt.grid(True)
    plt.savefig(output_filename)
    plt.close()

def visualize_gabor_features(gabor_features, output_filename):
    plt.figure(figsize=(8, 6))
    plt.bar(range(len(gabor_features)), gabor_features, color='blue')
    plt.title("Gabor Features")
    plt.xlabel("Kernel Index")
    plt.ylabel("Mean Response")
    plt.grid(True)
    plt.savefig(output_filename)
    plt.close()

def visualize_hu_moments(hu_moments, output_filename):
    plt.figure(figsize=(8, 6))
    plt.bar(range(1, len(hu_moments) + 1), -np.log10(np.abs(hu_moments)), color='orange')
    plt.title("Hu Moments (Log-Scaled)")
    plt.xlabel("Moment Index")
    plt.ylabel("Log Value")
    plt.grid(True)
    plt.savefig(output_filename)
    plt.close()

def visualize_lbp_histogram(hist_lbp, output_filename):
    plt.figure(figsize=(8, 6))
    plt.bar(range(len(hist_lbp)), hist_lbp, color='purple')
    plt.title("LBP Histogram")
    plt.xlabel("Patterns")
    plt.ylabel("Frequency")
    plt.grid(True)
    plt.savefig(output_filename)
    plt.close()

def visualize_hog(hog_features, output_filename):
    plt.figure(figsize=(8, 6))
    plt.plot(range(len(hog_features)), hog_features, color='green')
    plt.title("HOG Features")
    plt.xlabel("Feature Index")
    plt.ylabel("Value")
    plt.grid(True)
    plt.savefig(output_filename)
    plt.close()

def visualize_edge_histogram(edge_hist, output_filename):
    plt.figure(figsize=(8, 6))
    plt.bar(range(len(edge_hist)), edge_hist, color='blue')
    plt.title("Edge Direction Histogram")
    plt.xlabel("Angle Bins")
    plt.ylabel("Frequency")
    plt.grid(True)
    plt.savefig(output_filename)
    plt.close()

# Descriptor computation
def compute_descriptors(image_path):
    image = cv2.imread(image_path)
    if image is None:
        return None, "Invalid image format or corrupted image."
    if image.shape[0] < 10 or image.shape[1] < 10:
        return None, "Image is too small to process."

    # Color Histogram
    num_bins = 8
    color_hist = cv2.calcHist([image], [0, 1, 2], None, [num_bins, num_bins, num_bins], [0, 256, 0, 256, 0, 256])
    color_hist = cv2.normalize(color_hist, None).flatten()

    # Dominant Colors
    pixels = np.float32(image.reshape(-1, 3))
    n_colors = 3
    _, _, centers = cv2.kmeans(pixels, n_colors, None, (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0), 10, cv2.KMEANS_RANDOM_CENTERS)
    dominant_colors = centers.flatten().tolist()

    # Gabor Features
    gabor_kernels = [cv2.getGaborKernel((21, 21), 8.0, theta, 10.0, 0.5, 0, ktype=cv2.CV_32F) for theta in np.arange(0, np.pi, np.pi / 4)]
    gabor_features = [cv2.filter2D(cv2.cvtColor(image, cv2.COLOR_BGR2GRAY), cv2.CV_8UC3, kernel).mean() for kernel in gabor_kernels]

    # Hu Moments
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    moments = cv2.moments(gray)
    hu_moments = cv2.HuMoments(moments).flatten()

    # Local Binary Patterns (LBP)
    lbp = local_binary_pattern(gray, P=8, R=1, method='uniform')
    hist_lbp, _ = np.histogram(lbp.ravel(), bins=np.arange(0, 27), range=(0, 26))
    hist_lbp = cv2.normalize(hist_lbp, None).flatten()

    # Histogram of Oriented Gradients (HOG)
    hog_descriptor = cv2.HOGDescriptor()
    hog = hog_descriptor.compute(gray).flatten()
    max_hog_length = 1000  # Keep only the first 1000 elements
    hog = hog[::10]  # Downsample by taking every 10th value
    if len(hog) > max_hog_length:
        hog = hog[:max_hog_length]  # Truncate to 1000 elements

    # Edge Direction Histogram
    edges = cv2.Canny(gray, 100, 200)
    angles = cv2.phase(edges.astype(float), edges.astype(float), angleInDegrees=True)
    angle_hist, _ = np.histogram(angles, bins=18, range=(0, 180))
    angle_hist = angle_hist / np.sum(angle_hist)

    # Visualizations
    visualization_folder = app.config['VISUALIZATION_FOLDER']
    visualizations = {
        "color_histogram": os.path.join(visualization_folder, "color_histogram.png"),
        "dominant_colors": os.path.join(visualization_folder, "dominant_colors.png"),
        "gabor_features": os.path.join(visualization_folder, "gabor_features.png"),
        "hu_moments": os.path.join(visualization_folder, "hu_moments.png"),
        "lbp_histogram": os.path.join(visualization_folder, "lbp_histogram.png"),
        "hog_features": os.path.join(visualization_folder, "hog_features.png"),
        "edge_histogram": os.path.join(visualization_folder, "edge_histogram.png"),
    }

    # Generate visualizations
    visualize_color_histogram(image, visualizations["color_histogram"])
    visualize_dominant_colors(dominant_colors, visualizations["dominant_colors"])
    visualize_gabor_features(gabor_features, visualizations["gabor_features"])
    visualize_hu_moments(hu_moments, visualizations["hu_moments"])
    visualize_lbp_histogram(hist_lbp, visualizations["lbp_histogram"])
    visualize_hog(hog, visualizations["hog_features"])

    plt.figure(figsize=(8, 6))
    plt.bar(range(len(angle_hist)), angle_hist, color='blue')
    plt.title("Edge Direction Histogram")
    plt.xlabel("Angle Bins")
    plt.ylabel("Frequency")
    plt.grid(True)
    plt.savefig(visualizations["edge_histogram"])
    plt.close()

    # Return descriptors and visualization paths
    descriptors = {
        "color_histogram": color_hist.tolist(),
        "dominant_colors": dominant_colors,
        "gabor_features": gabor_features,
        "hu_moments": hu_moments.tolist(),
        "lbp": hist_lbp.tolist(),
        "hog": hog.tolist(),
        "edge_histogram": angle_hist.tolist(),
        "visualizations": {key: path.replace("\\", "/") for key, path in visualizations.items()},
    }

    return descriptors, None


# Flask-RESTful Resource
class Descriptor(Resource):
    @cross_origin()
    def options(self):
        """
        Handle preflight requests for CORS.
        """
        response = jsonify({'message': 'CORS preflight successful'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response, 200

    @cross_origin()
    def post(self):
        """
        POST endpoint to compute descriptors based on a filename.
        """
        # Check if filename is provided in JSON payload
        data = request.get_json()
        if not data or 'filename' not in data:
            return jsonify({'error': 'Filename is required'}), 400

        filename = data['filename']
        filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)

        # Check if the file exists in the shared uploads directory
        if not os.path.exists(filepath):
            return jsonify({'error': 'File not found in shared uploads folder'}), 404

        # Compute descriptors
        descriptors, error = compute_descriptors(filepath)
        if error:
            return jsonify({'status': 'error', 'message': error}), 400

        # Return descriptors and visualizations
        return jsonify({
            'status': 'success',
            'descriptors': descriptors,
            'visualizations': descriptors['visualizations']
        }), 200
api.add_resource(Descriptor, '/api/descriptors/compute')

@app.route('/visualizations/<filename>')
def serve_visualization(filename):
    """
    Serve the visualization images.
    """
    response = send_from_directory(app.config['VISUALIZATION_FOLDER'], filename)
    response.headers.add('Access-Control-Allow-Origin', '*')  # Ensure CORS for this route too
    return response

@app.route('/api/visualizations', methods=['POST'])
@cross_origin()
def get_visualizations():
    """
    Clear all existing visualizations and generate new ones for a given image filename.
    """
    data = request.get_json()
    if not data or 'filename' not in data:
        return jsonify({'error': 'Filename is required'}), 400

    filename = data['filename']
    image_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)

    # Check if the image exists
    if not os.path.exists(image_path):
        return jsonify({'error': 'File not found in shared uploads folder'}), 404

    visualization_folder = app.config['VISUALIZATION_FOLDER']

    # Delete all existing visualizations
    for file in os.listdir(visualization_folder):
        file_path = os.path.join(visualization_folder, file)
        try:
            if os.path.isfile(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"Error deleting file {file_path}: {e}")

    # Define paths for the new visualizations
    visualizations = {
        "color_histogram": os.path.join(visualization_folder, f"{filename}_color_histogram.png"),
        "dominant_colors": os.path.join(visualization_folder, f"{filename}_dominant_colors.png"),
        "gabor_features": os.path.join(visualization_folder, f"{filename}_gabor_features.png"),
        "hu_moments": os.path.join(visualization_folder, f"{filename}_hu_moments.png"),
        "lbp_histogram": os.path.join(visualization_folder, f"{filename}_lbp_histogram.png"),
        "hog_features": os.path.join(visualization_folder, f"{filename}_hog_features.png"),
        "edge_histogram": os.path.join(visualization_folder, f"{filename}_edge_histogram.png"),
    }

    try:
        # Load the image and generate visualizations
        image = cv2.imread(image_path)
        if image is None:
            return jsonify({'error': 'Invalid image format or corrupted image'}), 400

        print("[DEBUG] Generating visualizations...")

        # Generate visualizations
        visualize_color_histogram(image, visualizations["color_histogram"])
        print("[DEBUG] Color Histogram generated.")

        pixels = np.float32(image.reshape(-1, 3))
        n_colors = 3
        _, _, centers = cv2.kmeans(
            pixels, n_colors, None,
            (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0),
            10, cv2.KMEANS_RANDOM_CENTERS
        )
        visualize_dominant_colors(centers.flatten(), visualizations["dominant_colors"])
        print("[DEBUG] Dominant Colors generated.")

        gabor_kernels = [
            cv2.getGaborKernel((21, 21), 8.0, theta, 10.0, 0.5, 0, ktype=cv2.CV_32F)
            for theta in np.arange(0, np.pi, np.pi / 4)
        ]
        gabor_features = [cv2.filter2D(cv2.cvtColor(image, cv2.COLOR_BGR2GRAY), cv2.CV_8UC3, kernel).mean()
                          for kernel in gabor_kernels]
        visualize_gabor_features(gabor_features, visualizations["gabor_features"])
        print("[DEBUG] Gabor Features generated.")

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        moments = cv2.moments(gray)
        hu_moments = cv2.HuMoments(moments).flatten()
        visualize_hu_moments(hu_moments, visualizations["hu_moments"])
        print("[DEBUG] Hu Moments generated.")

        lbp = local_binary_pattern(gray, P=8, R=1, method='uniform')
        hist_lbp, _ = np.histogram(lbp.ravel(), bins=np.arange(0, 27), range=(0, 26))
        hist_lbp = cv2.normalize(hist_lbp, None).flatten()
        visualize_lbp_histogram(hist_lbp, visualizations["lbp_histogram"])
        print("[DEBUG] LBP Histogram generated.")

        hog_descriptor = cv2.HOGDescriptor()
        hog = hog_descriptor.compute(gray).flatten()
        max_hog_length = 1000  # Keep only the first 1000 elements
        hog = hog[::10]  # Downsample by taking every 10th value
        if len(hog) > max_hog_length:
            hog = hog[:max_hog_length]  # Truncate to 1000 elements
        visualize_hog(hog, visualizations["hog_features"])
        print("[DEBUG] HOG Features generated.")

        edges = cv2.Canny(gray, 100, 200)
        edge_hist, _ = np.histogram(edges.ravel(), bins=18, range=(0, 360))
        edge_hist = edge_hist / edge_hist.sum() if edge_hist.sum() > 0 else edge_hist
        visualize_edge_histogram(edge_hist, visualizations["edge_histogram"])
        print("[DEBUG] Edge Histogram generated.")

    except Exception as e:
        print(f"[ERROR] Error generating visualizations: {str(e)}")
        return jsonify({'error': f'Error generating visualizations: {str(e)}'}), 500

    # Return new visualization paths
    print("[DEBUG] All visualizations generated successfully.")
    return jsonify({
        'status': 'success',
        'visualizations': {key: value.replace("\\", "/") for key, value in visualizations.items()}
    }), 200

@app.route('/api/descriptors/simple-search', methods=['POST', 'OPTIONS'])
@cross_origin()
def simple_search():
    try:
        if request.method == 'OPTIONS':
            return '', 200

        # Parse input data
        data = request.get_json()
        if not data:
            print("[DEBUG] No data received.")
            return jsonify({'error': 'No data received'}), 400

        print(f"[DEBUG] Received data: {data}")

        if 'query_descriptors' not in data:
            print("[DEBUG] Missing 'query_descriptors'.")
            return jsonify({'error': 'Query descriptors are required'}), 400

        query_descriptors = data['query_descriptors']
        max_results = data.get('max_results', 10)

        print(f"[DEBUG] Query descriptors: {query_descriptors}")
        print(f"[DEBUG] Max results: {max_results}")

        # Connect to MongoDB
        from pymongo import MongoClient
        client = MongoClient('mongodb://localhost:27017/')
        db = client['imagesDB']
        images_collection = db['images']

        # Ensure database connection
        print("[DEBUG] Connected to MongoDB.")

        # Compute similarity scores
        def compute_similarity(image_descriptors, query_descriptors):
            import numpy as np
            score = 0
            if 'color_histogram' in image_descriptors and 'color_histogram' in query_descriptors:
                score += np.linalg.norm(
                    np.array(image_descriptors['color_histogram']) - np.array(query_descriptors['color_histogram'])
                )
            if 'dominant_colors' in image_descriptors and 'dominant_colors' in query_descriptors:
                score += np.linalg.norm(
                    np.array(image_descriptors['dominant_colors']) - np.array(query_descriptors['dominant_colors'])
                )
            return score

        # Retrieve all images and calculate similarity
        results = []
        for image in images_collection.find():
            if 'descriptors' not in image:
                print(f"[DEBUG] Image {image['filename']} missing descriptors.")
                continue

            similarity_score = compute_similarity(image['descriptors'], query_descriptors)
            results.append({
                'image_id': str(image['_id']),
                'filename': image['filename'],
                'similarity_score': similarity_score
            })

        # Sort results by similarity score
        results.sort(key=lambda x: x['similarity_score'])

        print(f"[DEBUG] Results: {results[:max_results]}")

        return jsonify({
            'status': 'success',
            'results': results[:max_results]
        })

    except Exception as e:
        print(f"[ERROR] Exception occurred: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

from datetime import datetime
from pymongo import MongoClient

@app.route('/api/descriptors/feedback', methods=['POST', 'OPTIONS'])
@cross_origin(origin='http://localhost:4200', headers=['Content-Type', 'Authorization'])
def handle_feedback():
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight successful'})
        response.status_code = 200
        response.headers.add('Access-Control-Allow-Origin', 'http://localhost:4200')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'POST,OPTIONS')
        return response

    try:
        data = request.get_json()
        if not data or 'image_id' not in data or 'feedback' not in data or 'query_descriptors' not in data:
            return jsonify({'error': 'Invalid request data'}), 400

        image_id = data['image_id']
        feedback = data['feedback']
        query_descriptors = data['query_descriptors']

        from pymongo import MongoClient
        client = MongoClient('mongodb://localhost:27017/')
        db = client['imagesDB']
        feedback_collection = db['feedback']

        feedback_data = {
            'query_descriptors': query_descriptors,
            'image_id': image_id,
            'feedback': feedback,
            'timestamp': datetime.utcnow()
        }
        feedback_collection.insert_one(feedback_data)

        return jsonify({'status': 'success', 'message': 'Feedback saved successfully!'}), 200
    except Exception as e:
        print(f"[ERROR] Exception occurred: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500

    

@app.route('/api/descriptors/feedback-search', methods=['POST'])
@cross_origin()
def feedback_search():
    try:
        data = request.get_json()
        if not data or 'query_descriptors' not in data:
            return jsonify({'error': 'Query descriptors are required'}), 400

        query_descriptors = data['query_descriptors']
        max_results = data.get('max_results', 10)

        client = MongoClient('mongodb://localhost:27017/')
        db = client['imagesDB']
        images_collection = db['images']
        feedback_collection = db['feedback']

        # Retrieve feedback matching the current query
        def is_similar(query1, query2, threshold=0.8):
            """Compute similarity between two descriptor vectors."""
            score = np.dot(np.array(query1), np.array(query2))
            return score >= threshold

        feedback_data = list(feedback_collection.find())
        relevant_feedback = [
            fb for fb in feedback_data
            if is_similar(fb['query_descriptors']['color_histogram'], query_descriptors['color_histogram'])
            and fb['feedback'] == 'relevant'
        ]
        non_relevant_feedback = [
            fb for fb in feedback_data
            if is_similar(fb['query_descriptors']['color_histogram'], query_descriptors['color_histogram'])
            and fb['feedback'] == 'non-relevant'
        ]

        # Safely retrieve images for relevant and non-relevant feedback
        relevant_images = [
            images_collection.find_one({'_id': feedback['image_id']})
            for feedback in relevant_feedback
        ]
        relevant_images = [img for img in relevant_images if img is not None]

        non_relevant_images = [
            images_collection.find_one({'_id': feedback['image_id']})
            for feedback in non_relevant_feedback
        ]
        non_relevant_images = [img for img in non_relevant_images if img is not None]

        # Compute feature probabilities
        def compute_feature_probabilities(images, feature_key):
            feature_values = [np.array(img['descriptors'][feature_key]) for img in images if feature_key in img['descriptors']]
            if not feature_values:
                return np.zeros_like(query_descriptors[feature_key])
            return np.mean(feature_values, axis=0)

        prob_relevant = compute_feature_probabilities(relevant_images, 'color_histogram')
        prob_non_relevant = compute_feature_probabilities(non_relevant_images, 'color_histogram')

        # Bayesian scoring
        results = []
        for image in images_collection.find():
            if 'descriptors' not in image:
                continue

            descriptors = np.array(image['descriptors']['color_histogram'])
            likelihood_relevant = np.dot(descriptors, prob_relevant)
            likelihood_non_relevant = np.dot(descriptors, prob_non_relevant)
            relevance_score = likelihood_relevant - likelihood_non_relevant

            results.append({
                'image_id': str(image['_id']),
                'filename': image['filename'],
                'similarity_score': relevance_score
            })

        # Sort results
        results.sort(key=lambda x: x['similarity_score'], reverse=True)

        return jsonify({
            'status': 'success',
            'results': results[:max_results]
        })

    except Exception as e:
        print(f"[ERROR] Exception occurred: {e}")
        return jsonify({'error': 'Internal server error', 'details': str(e)}), 500



# Main App Runner
if __name__ == '__main__':
    app.run(debug=True, port=5001)
