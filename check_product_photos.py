import pandas as pd
import csv

def analyze_product_photos():
    # Read the CSV file, skipping the first row which contains the problematic header
    df = pd.read_csv('Product photos, texture.csv', skiprows=1)
    
    # Check for missing URLs
    missing_texture = df[df['Product Texture Photo URL'].isna()]
    missing_bag = df[df['9lb bag Photo URL'].isna()]
    
    print("\n=== Missing Product Texture Photos ===")
    if len(missing_texture) > 0:
        for _, row in missing_texture.iterrows():
            print(f"Product: {row['Name']}")
    else:
        print("No missing texture photos found!")
        
    print("\n=== Missing 9lb Bag Photos ===")
    if len(missing_bag) > 0:
        for _, row in missing_bag.iterrows():
            print(f"Product: {row['Name']}")
    else:
        print("No missing 9lb bag photos found!")
        
    # Check for empty URLs
    empty_texture = df[df['Product Texture Photo URL'] == '']
    empty_bag = df[df['9lb bag Photo URL'] == '']
    
    print("\n=== Empty Product Texture Photos ===")
    if len(empty_texture) > 0:
        for _, row in empty_texture.iterrows():
            print(f"Product: {row['Name']}")
    else:
        print("No empty texture photos found!")
        
    print("\n=== Empty 9lb Bag Photos ===")
    if len(empty_bag) > 0:
        for _, row in empty_bag.iterrows():
            print(f"Product: {row['Name']}")
    else:
        print("No empty 9lb bag photos found!")

if __name__ == "__main__":
    analyze_product_photos() 