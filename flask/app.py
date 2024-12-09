# flask/app.py

import os
from flask import Flask, request, jsonify, send_from_directory
from flask_restful import Resource, Api
from flask_cors import CORS
from werkzeug.utils import secure_filename
import cv2
import numpy as np
import matplotlib
matplotlib.use('Agg')  # Use 'Agg' backend for non-interactive plotting
import matplotlib.pyplot as plt  # For optional visualization
from skimage.feature import local_binary_pattern  # For LBP

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes
api = Api(app)

# Configure upload folder and visualization folder
UPLOAD_FOLDER = 'uploads'
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
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def visualize_dominant_colors(dominant_colors, output_filename):
    """
    Visualize the dominant colors and save the image.
    Each dominant color is displayed as a colored square.
    """
    # Group into triples (B, G, R)
    colors = [dominant_colors[i:i+3] for i in range(0, len(dominant_colors), 3)]
    
    # Convert BGR to RGB for visualization
    colors = [color[::-1] for color in colors]
    
    # Normalize color values to [0,1] for matplotlib
    colors = [np.array(color) / 255.0 for color in colors]
    
    # Create a plot to display the dominant colors
    plt.figure(figsize=(6, 2))
    for i, color in enumerate(colors):
        plt.subplot(1, len(colors), i+1)
        plt.imshow([[color]])
        plt.axis('off')
        plt.title(f"Color {i+1}")
    plt.tight_layout()
    plt.savefig(output_filename)  # Save the plot as an image
    plt.close()

def visualize_color_histogram(image, output_filename):
    """
    Visualize the color histogram and save the image.
    """
    color = ('b', 'g', 'r')
    plt.figure(figsize=(8, 6))
    for i, col in enumerate(color):
        histogram = cv2.calcHist([image], [i], None, [256], [0, 256])
        plt.plot(histogram, color=col)
    plt.title("Color Histogram")
    plt.xlabel("Pixel Intensity")
    plt.ylabel("Frequency")
    plt.savefig(output_filename)  # Save the plot as an image
    plt.close()

def compute_descriptors(image_path):
    """
    Compute all descriptors for the given image.
    
    Parameters:
        image_path (str): Path to the image file.
    
    Returns:
        dict: Dictionary containing all descriptors.
        str: Error message if any (None if no error).
    """
    # Read the image using OpenCV
    image = cv2.imread(image_path)
    if image is None:
        return None, "Invalid image format or corrupted image."
    
    # Check image size
    if image.shape[0] < 10 or image.shape[1] < 10:
        return None, "Image is too small to process."

    # --- 1. Compute Color Histogram ---
    num_bins = 8  # Number of bins per channel (adjust as needed)
    color_hist = cv2.calcHist(
        [image],                # Image list
        [0, 1, 2],              # Channels: B, G, R
        None,                   # No mask
        [num_bins, num_bins, num_bins],  # Number of bins per channel
        [0, 256, 0, 256, 0, 256]         # Range for each channel
    )
    color_hist = cv2.normalize(color_hist, None).flatten()  # Normalize and flatten to 1D array
    
    # --- 2. Compute Dominant Colors using KMeans ---
    pixels = np.float32(image.reshape(-1, 3))  # Reshape image to (num_pixels, 3)
    n_colors = 3  # Number of dominant colors
    criteria = (cv2.TERM_CRITERIA_EPS + cv2.TERM_CRITERIA_MAX_ITER, 10, 1.0)
    
    # Apply KMeans clustering
    _, labels, centers = cv2.kmeans(
        pixels, 
        n_colors, 
        None, 
        criteria, 
        10, 
        cv2.KMEANS_RANDOM_CENTERS
    )
    dominant_colors = centers.flatten().tolist()  # Flatten to a list [B1, G1, R1, B2, G2, R2, ...]
    
    # --- 3. Compute Gabor Features ---
    gabor_kernels = [
        cv2.getGaborKernel((21, 21), 8.0, theta, 10.0, 0.5, 0, ktype=cv2.CV_32F)
        for theta in np.arange(0, np.pi, np.pi / 4)
    ]
    gabor_features = []
    for kernel in gabor_kernels:
        fimg = cv2.filter2D(cv2.cvtColor(image, cv2.COLOR_BGR2GRAY), cv2.CV_8UC3, kernel)
        gabor_features.append(fimg.mean())
    gabor_features = np.array(gabor_features).tolist()
    
    # --- 4. Compute Hu Moments ---
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    moments = cv2.moments(gray)
    hu_moments = cv2.HuMoments(moments).flatten().tolist()
    
    # --- 5. Compute Local Binary Patterns (LBP) ---
    lbp = local_binary_pattern(gray, P=8, R=1, method='uniform')
    (hist_lbp, _) = np.histogram(
        lbp.ravel(),
        bins=np.arange(0, 27),  # For uniform LBP with P=8
        range=(0, 26)
    )
    hist_lbp = cv2.normalize(hist_lbp, None).flatten().tolist()
    
    # --- 6. Compute Histogram of Oriented Gradients (HOG) ---
    hog_descriptor = cv2.HOGDescriptor()
    hog = hog_descriptor.compute(gray)
    hog_features = hog.flatten().tolist()
    
    # --- Generate Visualizations ---
    # Save dominant color visualization
    dominant_colors_image_path = os.path.join(app.config['VISUALIZATION_FOLDER'], 'dominant_colors.png')
    visualize_dominant_colors(dominant_colors, dominant_colors_image_path)
    
    # Save color histogram visualization
    color_hist_image_path = os.path.join(app.config['VISUALIZATION_FOLDER'], 'color_histogram.png')
    visualize_color_histogram(image, color_hist_image_path)
    
    # --- Prepare the Descriptors Dictionary ---
    descriptors = {
        "color_histogram": color_hist.tolist(),
        "dominant_colors": dominant_colors,
        "gabor_features": gabor_features,
        "hu_moments": hu_moments,
        "lbp": hist_lbp,
        "hog": hog_features,
        "visualizations": {
            "dominant_colors": dominant_colors_image_path,
            "color_histogram": color_hist_image_path
        }
    }
    
    return descriptors, None

class Descriptor(Resource):
    """
    Flask-RESTful Resource for computing image descriptors.
    """
    def post(self):
        """
        Handle POST requests to compute image descriptors.
        Expects an image file in the 'image' form-data field.
        """
        if 'image' not in request.files:
            return {'error': 'No image part in the request'}, 400

        file = request.files['image']
        if file.filename == '':
            return {'error': 'No selected file'}, 400

        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)  # Save the uploaded file to the server

            # Compute descriptors
            descriptors, error = compute_descriptors(filepath)
            if error:
                return {'status': 'error', 'message': error}, 400

            # Optionally, delete the file after processing to save space
            os.remove(filepath)

            return {'status': 'success', 'descriptors': descriptors}, 200
        else:
            return {'status': 'error', 'message': 'File type not allowed'}, 400

# Add the Descriptor resource to the API
api.add_resource(Descriptor, '/compute-descriptors')

@app.route('/visualizations/<filename>')
def serve_visualization(filename):
    """
    Serve the saved visualizations as image files.
    """
    return send_from_directory(app.config['VISUALIZATION_FOLDER'], filename)

if __name__ == '__main__':
    # Run the Flask app
    app.run(debug=True, port=5001)
