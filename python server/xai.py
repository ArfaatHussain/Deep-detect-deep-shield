def analyze_heatmap_regions(grad_cam):
    h, w = grad_cam.shape
    
    # Define regions and their average attention
    regions = {
        "forehead/hair": grad_cam[0:h//3, :].mean(),
        "eyes/nose": grad_cam[h//3:2*h//3, :].mean(),
        "mouth/chin": grad_cam[2*h//3:, :].mean(),
        "left side": grad_cam[:, :w//3].mean(),
        "right side": grad_cam[:, 2*w//3:].mean()
    }
    
    # Threshold to consider a region as significant (e.g., attention > 0.1)
    significant_regions = [region for region, attention in regions.items() if attention > 0.1]
    
    # Find the region with the highest attention
    main_focus = max(regions, key=regions.get)
    
    return main_focus, regions, significant_regions

def generate_dynamic_explanation(pred_class, main_focus, significant_regions):

    if main_focus in ["forehead/hair", "left side", "right side"]:
        explanation = f"This image is classified as Fake. The model concentrated on {main_focus}, possibly detecting unnatural patterns or artifacts in that area."
    else:
        explanation = f"This image is classified as Fake. Attention was on {main_focus}, indicating irregularities in facial structure."
        
        # Add a note if multiple manipulated regions are present
    if significant_regions:
        explanation += f"Total manipulations regions are {', '.join(significant_regions)}."
    
    return explanation
