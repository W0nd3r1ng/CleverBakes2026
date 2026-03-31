#!/usr/bin/env python3
"""
CleverBakes Backend API Testing Suite
Tests all API endpoints for the Filipino bakery ordering platform
"""

import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

class CleverBakesAPITester:
    def __init__(self, base_url: str = "https://order-tracker-dash-2.preview.emergentagent.com"):
        self.base_url = f"{base_url}/api"
        self.session = requests.Session()
        self.session.headers.update({'Content-Type': 'application/json'})
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data
        self.admin_credentials = {"username": "admin", "password": "cleverbakes2025"}
        self.test_product = {
            "name": "Test Cupcake",
            "description": "A test cupcake for API testing",
            "price": 150.0,
            "variations": ["Chocolate", "Vanilla"],
            "sizes": ["Regular", "Mini"]
        }
        self.test_order = None
        self.test_review = None
        self.test_category = {
            "name": "Test Category",
            "description": "A test category for API testing",
            "sort_order": 99
        }
        self.created_product_id = None
        self.created_order_id = None
        self.created_review_id = None
        self.created_category_id = None

    def log_test(self, name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            status = "✅ PASS"
        else:
            status = "❌ FAIL"
        
        result = {
            "test": name,
            "status": status,
            "success": success,
            "details": details,
            "response_data": response_data
        }
        self.test_results.append(result)
        print(f"{status} - {name}: {details}")
        return success

    def make_request(self, method: str, endpoint: str, data: Dict = None, expected_status: int = 200, use_auth: bool = False) -> tuple[bool, Dict]:
        """Make HTTP request and validate response"""
        url = f"{self.base_url}/{endpoint.lstrip('/')}"
        headers = {}
        
        if use_auth and self.admin_token:
            headers['Authorization'] = f'Bearer {self.admin_token}'
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=headers)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=headers)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, headers=headers)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=headers)
            else:
                return False, {"error": f"Unsupported method: {method}"}

            success = response.status_code == expected_status
            try:
                response_data = response.json()
            except:
                response_data = {"raw_response": response.text, "status_code": response.status_code}
            
            return success, response_data
            
        except Exception as e:
            return False, {"error": str(e)}

    def test_admin_login(self) -> bool:
        """Test admin login functionality"""
        print("\n🔐 Testing Admin Authentication...")
        
        # Test valid login
        success, response = self.make_request('POST', '/auth/login', self.admin_credentials, 200)
        if success and response.get('success') and response.get('token'):
            self.admin_token = response['token']
            # Also set cookie for session-based auth
            if hasattr(response, 'cookies'):
                self.session.cookies.update(response.cookies)
            return self.log_test("Admin Login", True, f"Token received: {self.admin_token[:20]}...")
        else:
            return self.log_test("Admin Login", False, f"Login failed: {response}")

    def test_admin_auth_endpoints(self) -> bool:
        """Test auth-related endpoints"""
        print("\n🔑 Testing Auth Endpoints...")
        
        # Test /auth/me
        success, response = self.make_request('GET', '/auth/me', use_auth=True)
        if not self.log_test("Auth Me", success and response.get('success'), f"Response: {response}"):
            return False
        
        # Test invalid credentials
        invalid_creds = {"username": "wrong", "password": "wrong"}
        success, response = self.make_request('POST', '/auth/login', invalid_creds, 401)
        self.log_test("Invalid Login", success, f"Correctly rejected invalid credentials")
        
        return True

    def test_products_api(self) -> bool:
        """Test products CRUD operations"""
        print("\n📦 Testing Products API...")
        
        # Test GET /products (should return seeded products)
        success, response = self.make_request('GET', '/products')
        if not success or not response.get('success'):
            return self.log_test("Get Products", False, f"Failed to get products: {response}")
        
        products = response.get('data', [])
        if len(products) < 15:
            self.log_test("Get Products", False, f"Expected 15+ seeded products, got {len(products)}")
        else:
            self.log_test("Get Products", True, f"Retrieved {len(products)} products")
        
        # Test product structure
        if products:
            product = products[0]
            required_fields = ['id', 'name', 'price', 'description']
            missing_fields = [f for f in required_fields if f not in product]
            if missing_fields:
                self.log_test("Product Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Product Structure", True, "All required fields present")
        
        # Test CREATE product (requires auth)
        success, response = self.make_request('POST', '/products', self.test_product, 200, use_auth=True)
        if success and response.get('success'):
            self.created_product_id = response['data']['id']
            self.log_test("Create Product", True, f"Created product ID: {self.created_product_id}")
        else:
            return self.log_test("Create Product", False, f"Failed to create product: {response}")
        
        # Test GET single product
        success, response = self.make_request('GET', f'/products/{self.created_product_id}')
        self.log_test("Get Single Product", success and response.get('success'), f"Retrieved product: {response.get('data', {}).get('name', 'N/A')}")
        
        # Test UPDATE product (requires auth)
        update_data = {"name": "Updated Test Cupcake", "price": 175.0}
        success, response = self.make_request('PUT', f'/products/{self.created_product_id}', update_data, 200, use_auth=True)
        self.log_test("Update Product", success and response.get('success'), f"Updated product")
        
        return True

    def test_orders_api(self) -> bool:
        """Test orders CRUD operations"""
        print("\n🛒 Testing Orders API...")
        
        # Test CREATE order
        self.test_order = {
            "product_name": "Test Cupcake",
            "customer_name": "John Doe",
            "contact_number": "09123456789",
            "address": "123 Test Street, Test City",
            "delivery_method": "Pick Up",
            "flavor": "Chocolate",
            "size": "Regular",
            "quantity": 2,
            "total": 300.0,
            "payment_method": "COD"
        }
        
        success, response = self.make_request('POST', '/orders', self.test_order, 200)
        if success and response.get('success'):
            order_data = response['data']
            self.created_order_id = order_data['id']
            order_number = order_data['order_number']
            self.log_test("Create Order", True, f"Created order #{order_number} (ID: {self.created_order_id})")
            
            # Test order tracking
            success, response = self.make_request('GET', f'/orders/track/{order_number}')
            self.log_test("Track Order", success and response.get('success'), f"Tracked order #{order_number}")
            
        else:
            return self.log_test("Create Order", False, f"Failed to create order: {response}")
        
        # Test GET all orders (requires auth)
        success, response = self.make_request('GET', '/orders', use_auth=True)
        if success and response.get('success'):
            orders = response.get('data', [])
            self.log_test("Get All Orders", True, f"Retrieved {len(orders)} orders")
        else:
            return self.log_test("Get All Orders", False, f"Failed to get orders: {response}")
        
        # Test UPDATE order status (requires auth)
        success, response = self.make_request('PUT', f'/orders/{self.created_order_id}/status', {"status": "Confirmed"}, 200, use_auth=True)
        self.log_test("Update Order Status", success and response.get('success'), "Updated order status to Confirmed")
        
        # Test UPDATE payment status (requires auth)
        success, response = self.make_request('PUT', f'/orders/{self.created_order_id}/payment', {"payment_status": "Paid"}, 200, use_auth=True)
        self.log_test("Update Payment Status", success and response.get('success'), "Updated payment status to Paid")
        
        return True

    def test_reviews_api(self) -> bool:
        """Test reviews CRUD operations"""
        print("\n⭐ Testing Reviews API...")
        
        # Test CREATE review
        self.test_review = {
            "name": "Test Customer",
            "rating": 5,
            "message": "Great cupcakes! Highly recommended."
        }
        
        success, response = self.make_request('POST', '/reviews', self.test_review, 200)
        if success and response.get('success'):
            self.created_review_id = response['data']['id']
            self.log_test("Create Review", True, f"Created review ID: {self.created_review_id}")
        else:
            return self.log_test("Create Review", False, f"Failed to create review: {response}")
        
        # Test GET reviews (all)
        success, response = self.make_request('GET', '/reviews')
        if success and response.get('success'):
            all_reviews = response.get('data', [])
            self.log_test("Get All Reviews", True, f"Retrieved {len(all_reviews)} reviews")
        else:
            return self.log_test("Get All Reviews", False, f"Failed to get reviews: {response}")
        
        # Test GET approved reviews only
        success, response = self.make_request('GET', '/reviews?approved_only=true')
        if success and response.get('success'):
            approved_reviews = response.get('data', [])
            self.log_test("Get Approved Reviews", True, f"Retrieved {len(approved_reviews)} approved reviews")
        else:
            return self.log_test("Get Approved Reviews", False, f"Failed to get approved reviews: {response}")
        
        # Test TOGGLE review approval (requires auth)
        success, response = self.make_request('PUT', f'/reviews/{self.created_review_id}/toggle', {"approved": True}, 200, use_auth=True)
        self.log_test("Toggle Review Approval", success and response.get('success'), "Approved review")
        
        return True

    def test_categories_api(self) -> bool:
        """Test categories CRUD operations"""
        print("\n🏷️ Testing Categories API...")
        
        # Test GET /categories (should return seeded categories)
        success, response = self.make_request('GET', '/categories')
        if not success or not response.get('success'):
            return self.log_test("Get Categories", False, f"Failed to get categories: {response}")
        
        categories = response.get('data', [])
        expected_categories = ["Cakes", "Cookies", "Breads & Pastries", "Brownies"]
        if len(categories) < 4:
            self.log_test("Get Categories", False, f"Expected 4+ seeded categories, got {len(categories)}")
        else:
            category_names = [cat.get('name', '') for cat in categories]
            missing_categories = [cat for cat in expected_categories if cat not in category_names]
            if missing_categories:
                self.log_test("Get Categories", False, f"Missing seeded categories: {missing_categories}")
            else:
                self.log_test("Get Categories", True, f"Retrieved {len(categories)} categories with all expected seeded categories")
        
        # Test category structure
        if categories:
            category = categories[0]
            required_fields = ['id', 'name', 'sort_order']
            missing_fields = [f for f in required_fields if f not in category]
            if missing_fields:
                self.log_test("Category Structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_test("Category Structure", True, "All required fields present")
        
        # Test CREATE category (requires auth)
        success, response = self.make_request('POST', '/categories', self.test_category, 200, use_auth=True)
        if success and response.get('success'):
            self.created_category_id = response['data']['id']
            self.log_test("Create Category", True, f"Created category ID: {self.created_category_id}")
        else:
            return self.log_test("Create Category", False, f"Failed to create category: {response}")
        
        # Test UPDATE category (requires auth)
        update_data = {"name": "Updated Test Category", "description": "Updated description"}
        success, response = self.make_request('PUT', f'/categories/{self.created_category_id}', update_data, 200, use_auth=True)
        self.log_test("Update Category", success and response.get('success'), f"Updated category")
        
        # Test that products have category_id field
        success, response = self.make_request('GET', '/products')
        if success and response.get('success'):
            products = response.get('data', [])
            products_with_categories = [p for p in products if p.get('category_id')]
            if len(products_with_categories) >= 10:  # Most products should have categories
                self.log_test("Products Category Assignment", True, f"{len(products_with_categories)} products have category assignments")
            else:
                self.log_test("Products Category Assignment", False, f"Only {len(products_with_categories)} products have category assignments")
        
        return True

    def test_image_upload(self) -> bool:
        """Test image upload functionality"""
        print("\n🖼️ Testing Image Upload...")
        
        # Create a simple test image (1x1 pixel PNG)
        import base64
        test_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGA6VP8IQAAAABJRU5ErkJggg=="
        test_image_data = base64.b64decode(test_image_b64)
        
        # Note: This is a simplified test - actual file upload would require multipart/form-data
        # For now, we'll just test that the endpoint exists
        try:
            url = f"{self.base_url}/upload"
            # This will likely fail without proper multipart data, but we can check if endpoint exists
            response = self.session.post(url)
            if response.status_code in [400, 422]:  # Expected for missing file
                self.log_test("Upload Endpoint", True, "Upload endpoint exists (returns expected error for missing file)")
            else:
                self.log_test("Upload Endpoint", False, f"Unexpected response: {response.status_code}")
        except Exception as e:
            self.log_test("Upload Endpoint", False, f"Upload endpoint error: {e}")
        
        return True

    def cleanup_test_data(self):
        """Clean up created test data"""
        print("\n🧹 Cleaning up test data...")
        
        # Delete test product
        if self.created_product_id:
            success, response = self.make_request('DELETE', f'/products/{self.created_product_id}', use_auth=True)
            self.log_test("Cleanup Product", success, f"Deleted test product")
        
        # Delete test order
        if self.created_order_id:
            success, response = self.make_request('DELETE', f'/orders/{self.created_order_id}', use_auth=True)
            self.log_test("Cleanup Order", success, f"Deleted test order")
        
        # Delete test review
        if self.created_review_id:
            success, response = self.make_request('DELETE', f'/reviews/{self.created_review_id}', use_auth=True)
            self.log_test("Cleanup Review", success, f"Deleted test review")
        
        # Delete test category
        if self.created_category_id:
            success, response = self.make_request('DELETE', f'/categories/{self.created_category_id}', use_auth=True)
            self.log_test("Cleanup Category", success, f"Deleted test category")

    def run_all_tests(self) -> bool:
        """Run complete test suite"""
        print("🧪 Starting CleverBakes Backend API Tests")
        print(f"🌐 Testing against: {self.base_url}")
        print("=" * 60)
        
        try:
            # Authentication tests
            if not self.test_admin_login():
                print("❌ Authentication failed - stopping tests")
                return False
            
            self.test_admin_auth_endpoints()
            
            # API tests
            self.test_products_api()
            self.test_categories_api()
            self.test_orders_api()
            self.test_reviews_api()
            self.test_image_upload()
            
            # Cleanup
            self.cleanup_test_data()
            
        except Exception as e:
            print(f"❌ Test suite error: {e}")
            return False
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        print(f"✅ Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print(f"\n❌ Failed Tests ({len(failed_tests)}):")
            for test in failed_tests:
                print(f"  - {test['test']}: {test['details']}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = CleverBakesAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/backend_test_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': (tester.tests_passed/tester.tests_run)*100 if tester.tests_run > 0 else 0,
            'results': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())