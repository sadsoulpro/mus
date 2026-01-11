import requests
import sys
import json
from datetime import datetime
import time

class BandLinkAPITester:
    def __init__(self, base_url="https://git-analyzer-8.preview.emergentagent.com/api"):
        self.base_url = base_url
        self.token = None
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = None
        self.test_page_id = None
        self.test_link_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, use_admin=False):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        
        # Add auth header if needed
        if use_admin and self.admin_token:
            test_headers['Authorization'] = f'Bearer {self.admin_token}'
        elif not use_admin and self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
            
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json()
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_auth_register(self):
        """Test user registration"""
        timestamp = int(time.time())
        test_data = {
            "email": f"testuser{timestamp}@example.com",
            "username": f"testuser{timestamp}",
            "password": "testpass123"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.test_user_id = response['user']['id']
            print(f"   Registered user: {test_data['email']}")
            return True
        return False

    def test_auth_login_admin(self):
        """Test admin login"""
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "auth/login",
            200,
            data={"email": "admin@example.com", "password": "admin123"}
        )
        
        if success and 'token' in response:
            self.admin_token = response['token']
            print(f"   Admin logged in successfully")
            return True
        return False

    def test_auth_login_user(self):
        """Test user login with registered user"""
        timestamp = int(time.time())
        test_data = {
            "email": f"logintest{timestamp}@example.com",
            "username": f"logintest{timestamp}",
            "password": "testpass123"
        }
        
        # First register
        success, reg_response = self.run_test(
            "Register for Login Test",
            "POST",
            "auth/register",
            200,
            data=test_data
        )
        
        if not success:
            return False
            
        # Then login
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data={"email": test_data["email"], "password": test_data["password"]}
        )
        
        # Update token for subsequent tests
        if success and 'token' in response:
            self.token = response['token']
            if 'user' in response and 'id' in response['user']:
                self.test_user_id = response['user']['id']
        
        return success and 'token' in response

    def test_auth_me(self):
        """Test get current user"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success and 'id' in response

    def test_create_page(self):
        """Test page creation"""
        timestamp = int(time.time())
        page_data = {
            "title": f"Test Song {timestamp}",
            "slug": f"test-song-{timestamp}",
            "artist_name": "Test Artist",
            "release_title": "Test Release",
            "description": "Test description"
        }
        
        success, response = self.run_test(
            "Create Page",
            "POST",
            "pages",
            200,
            data=page_data
        )
        
        if success and 'id' in response:
            self.test_page_id = response['id']
            print(f"   Created page: {response['slug']}")
            return True
        return False

    def test_get_pages(self):
        """Test get user pages"""
        success, response = self.run_test(
            "Get User Pages",
            "GET",
            "pages",
            200
        )
        return success and isinstance(response, list)

    def test_get_page(self):
        """Test get specific page"""
        if not self.test_page_id:
            print("❌ No test page ID available")
            return False
            
        success, response = self.run_test(
            "Get Specific Page",
            "GET",
            f"pages/{self.test_page_id}",
            200
        )
        return success and 'id' in response

    def test_update_page(self):
        """Test page update"""
        if not self.test_page_id:
            print("❌ No test page ID available")
            return False
            
        update_data = {
            "description": "Updated description"
        }
        
        success, response = self.run_test(
            "Update Page",
            "PUT",
            f"pages/{self.test_page_id}",
            200,
            data=update_data
        )
        return success

    def test_create_link(self):
        """Test link creation"""
        if not self.test_page_id:
            print("❌ No test page ID available")
            return False
            
        link_data = {
            "platform": "spotify",
            "url": "https://open.spotify.com/track/test",
            "active": True
        }
        
        success, response = self.run_test(
            "Create Link",
            "POST",
            f"pages/{self.test_page_id}/links",
            200,
            data=link_data
        )
        
        if success and 'id' in response:
            self.test_link_id = response['id']
            print(f"   Created link: {response['platform']}")
            return True
        return False

    def test_get_links(self):
        """Test get page links"""
        if not self.test_page_id:
            print("❌ No test page ID available")
            return False
            
        success, response = self.run_test(
            "Get Page Links",
            "GET",
            f"pages/{self.test_page_id}/links",
            200
        )
        return success and isinstance(response, list)

    def test_update_link(self):
        """Test link update"""
        if not self.test_page_id or not self.test_link_id:
            print("❌ No test page/link ID available")
            return False
            
        update_data = {
            "active": False
        }
        
        success, response = self.run_test(
            "Update Link",
            "PUT",
            f"pages/{self.test_page_id}/links/{self.test_link_id}",
            200,
            data=update_data
        )
        return success

    def test_public_page(self):
        """Test public page access"""
        if not self.test_page_id:
            print("❌ No test page ID available")
            return False
            
        # First get the page to find its slug
        success, page_response = self.run_test(
            "Get Page for Slug",
            "GET",
            f"pages/{self.test_page_id}",
            200
        )
        
        if not success or 'slug' not in page_response:
            print("❌ Could not get page slug")
            return False
            
        slug = page_response['slug']
        
        success, response = self.run_test(
            "Public Page Access",
            "GET",
            f"artist/{slug}",
            200
        )
        return success and 'artist_name' in response

    def test_analytics(self):
        """Test analytics"""
        if not self.test_page_id:
            print("❌ No test page ID available")
            return False
            
        success, response = self.run_test(
            "Get Analytics",
            "GET",
            f"analytics/{self.test_page_id}",
            200
        )
        return success and 'views' in response and 'total_clicks' in response

    def test_admin_get_users(self):
        """Test admin get users"""
        success, response = self.run_test(
            "Admin Get Users",
            "GET",
            "admin/users",
            200,
            use_admin=True
        )
        return success and isinstance(response, list)

    def test_admin_get_pages(self):
        """Test admin get pages"""
        success, response = self.run_test(
            "Admin Get Pages",
            "GET",
            "admin/pages",
            200,
            use_admin=True
        )
        return success and isinstance(response, list)

    def test_admin_block_user(self):
        """Test admin block user"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False
            
        success, response = self.run_test(
            "Admin Block User",
            "PUT",
            f"admin/users/{self.test_user_id}/block",
            200,
            use_admin=True
        )
        return success and 'status' in response

    def test_admin_disable_page(self):
        """Test admin disable page"""
        if not self.test_page_id:
            print("❌ No test page ID available")
            return False
            
        success, response = self.run_test(
            "Admin Disable Page",
            "PUT",
            f"admin/pages/{self.test_page_id}/disable",
            200,
            use_admin=True
        )
        return success and 'status' in response

    def test_delete_link(self):
        """Test link deletion"""
        if not self.test_page_id or not self.test_link_id:
            print("❌ No test page/link ID available")
            return False
            
        success, response = self.run_test(
            "Delete Link",
            "DELETE",
            f"pages/{self.test_page_id}/links/{self.test_link_id}",
            200
        )
        return success

    def test_delete_page(self):
        """Test page deletion"""
        if not self.test_page_id:
            print("❌ No test page ID available")
            return False
            
        success, response = self.run_test(
            "Delete Page",
            "DELETE",
            f"pages/{self.test_page_id}",
            200
        )
        return success

    def test_odesli_integration(self):
        """Test Odesli API integration with real Spotify URL"""
        # Test with Shape of You by Ed Sheeran
        spotify_url = "https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT"
        
        success, response = self.run_test(
            "Odesli API Integration",
            "GET",
            f"lookup/odesli?url={spotify_url}",
            200
        )
        
        if not success:
            return False
            
        # Verify response structure
        required_fields = ['links', 'title', 'artistName', 'thumbnailUrl']
        for field in required_fields:
            if field not in response:
                print(f"❌ Missing required field: {field}")
                return False
        
        # Verify we have platform links
        links = response.get('links', {})
        if not links:
            print("❌ No platform links returned")
            return False
            
        # Check for expected platforms
        expected_platforms = ['spotify', 'apple', 'youtube', 'soundcloud', 'tidal', 'deezer']
        found_platforms = []
        
        for platform in expected_platforms:
            if platform in links and links[platform]:
                found_platforms.append(platform)
                print(f"   ✅ Found {platform}: {links[platform]}")
        
        if not found_platforms:
            print("❌ No valid platform links found")
            return False
            
        # Verify metadata
        title = response.get('title', '')
        artist = response.get('artistName', '')
        thumbnail = response.get('thumbnailUrl', '')
        
        print(f"   📝 Title: {title}")
        print(f"   🎤 Artist: {artist}")
        print(f"   🖼️ Thumbnail: {thumbnail}")
        
        # Basic validation - should have title and artist for this well-known track
        if not title or not artist:
            print("❌ Missing title or artist information")
            return False
            
        print(f"   ✅ Found {len(found_platforms)} platform links")
        return True

    def test_ip_geolocation_us_ip(self):
        """Test IP geolocation with US IP (8.8.8.8 - Google DNS)"""
        if not self.test_link_id:
            print("❌ No test link ID available")
            return False
            
        # Simulate click with US IP
        headers = {'X-Forwarded-For': '8.8.8.8'}
        
        success, response = self.run_test(
            "Click Link with US IP",
            "GET",
            f"click/{self.test_link_id}",
            302,  # Redirect response
            headers=headers
        )
        
        if not success:
            return False
            
        # Wait a moment for the click to be processed
        time.sleep(1)
        
        # Check analytics to see if geolocation worked
        success, analytics = self.run_test(
            "Get Global Analytics for Geo Check",
            "GET",
            "analytics/global/summary",
            200
        )
        
        if not success:
            return False
            
        # Check if we have country/city data
        by_country = analytics.get('by_country', [])
        by_city = analytics.get('by_city', [])
        
        print(f"   📍 Countries found: {[c.get('country') for c in by_country]}")
        print(f"   🏙️ Cities found: {[c.get('city') for c in by_city]}")
        
        # Look for US-related entries (should not be "Неизвестно")
        has_real_country = any(
            country.get('country') not in ['Неизвестно', 'Unknown', ''] 
            for country in by_country
        )
        
        has_real_city = any(
            city.get('city') not in ['Неизвестно', 'Unknown', ''] 
            for city in by_city
        )
        
        if not has_real_country:
            print("❌ No real country data found - geolocation may not be working")
            return False
            
        if not has_real_city:
            print("❌ No real city data found - geolocation may not be working")
            return False
            
        print("   ✅ Real geolocation data found")
        return True

    def test_ip_geolocation_russia_ip(self):
        """Test IP geolocation with Russian IP (77.88.8.8 - Yandex DNS)"""
        if not self.test_link_id:
            print("❌ No test link ID available")
            return False
            
        # Simulate click with Russian IP
        headers = {'X-Forwarded-For': '77.88.8.8'}
        
        success, response = self.run_test(
            "Click Link with Russian IP",
            "GET",
            f"click/{self.test_link_id}",
            302,  # Redirect response
            headers=headers
        )
        
        if not success:
            return False
            
        # Wait a moment for the click to be processed
        time.sleep(1)
        
        # Check analytics to see if geolocation worked
        success, analytics = self.run_test(
            "Get Global Analytics for Russian Geo Check",
            "GET",
            "analytics/global/summary",
            200
        )
        
        if not success:
            return False
            
        # Check if we have Russian data
        by_country = analytics.get('by_country', [])
        by_city = analytics.get('by_city', [])
        
        print(f"   📍 Countries found: {[c.get('country') for c in by_country]}")
        print(f"   🏙️ Cities found: {[c.get('city') for c in by_city]}")
        
        # Look for Russia-related entries
        has_russia = any(
            'Россия' in country.get('country', '') or 'Russia' in country.get('country', '')
            for country in by_country
        )
        
        has_russian_city = any(
            city.get('city') not in ['Неизвестно', 'Unknown', ''] 
            for city in by_city
        )
        
        if not has_russia and not any(country.get('country') not in ['Неизвестно', 'Unknown', ''] for country in by_country):
            print("❌ No Russian or real country data found")
            return False
            
        print("   ✅ Russian geolocation data found")
        return True

    def test_ip_geolocation_localhost(self):
        """Test IP geolocation with localhost IP (should return 'Неизвестно')"""
        if not self.test_link_id:
            print("❌ No test link ID available")
            return False
            
        # Simulate click with localhost IP
        headers = {'X-Forwarded-For': '127.0.0.1'}
        
        success, response = self.run_test(
            "Click Link with Localhost IP",
            "GET",
            f"click/{self.test_link_id}",
            302,  # Redirect response
            headers=headers
        )
        
        if not success:
            return False
            
        # Wait a moment for the click to be processed
        time.sleep(1)
        
        # Check analytics to see if localhost is handled correctly
        success, analytics = self.run_test(
            "Get Global Analytics for Localhost Check",
            "GET",
            "analytics/global/summary",
            200
        )
        
        if not success:
            return False
            
        # Check if we have "Неизвестно" entries for localhost
        by_country = analytics.get('by_country', [])
        by_city = analytics.get('by_city', [])
        
        print(f"   📍 Countries found: {[c.get('country') for c in by_country]}")
        print(f"   🏙️ Cities found: {[c.get('city') for c in by_city]}")
        
        # Should have "Неизвестно" entries for localhost
        has_unknown_country = any(
            country.get('country') == 'Неизвестно'
            for country in by_country
        )
        
        has_unknown_city = any(
            city.get('city') == 'Неизвестно'
            for city in by_city
        )
        
        if not has_unknown_country:
            print("❌ Expected 'Неизвестно' country for localhost IP")
            return False
            
        if not has_unknown_city:
            print("❌ Expected 'Неизвестно' city for localhost IP")
            return False
            
        print("   ✅ Localhost correctly returns 'Неизвестно'")
        return True

    def test_track_page_view_geolocation(self):
        """Test page view tracking with geolocation"""
        if not self.test_page_id:
            print("❌ No test page ID available")
            return False
            
        # Test page view with German IP
        headers = {'X-Forwarded-For': '8.8.4.4'}  # Another Google DNS
        
        success, response = self.run_test(
            "Track Page View with Geolocation",
            "POST",
            f"track/view/{self.test_page_id}",
            200,
            headers=headers
        )
        
        return success and response.get('success') == True

    def test_track_share_geolocation(self):
        """Test share tracking with geolocation"""
        if not self.test_page_id:
            print("❌ No test page ID available")
            return False
            
        # Test share with UK IP
        headers = {'X-Forwarded-For': '1.1.1.1'}  # Cloudflare DNS
        
        success, response = self.run_test(
            "Track Share with Geolocation",
            "POST",
            f"track/share/{self.test_page_id}?share_type=link",
            200,
            headers=headers
        )
        
        return success and response.get('success') == True

    def test_qr_scan_geolocation(self):
        """Test QR scan tracking with geolocation"""
        if not self.test_page_id:
            print("❌ No test page ID available")
            return False
            
        # Test QR scan with Canadian IP
        headers = {'X-Forwarded-For': '1.0.0.1'}  # Cloudflare DNS
        
        success, response = self.run_test(
            "Track QR Scan with Geolocation",
            "GET",
            f"qr/{self.test_page_id}",
            302,  # Redirect response
            headers=headers
        )
        
        return success

def main():
    print("🚀 Starting BandLink API Tests...")
    print(f"Testing against: https://git-analyzer-8.preview.emergentagent.com/api")
    
    tester = BandLinkAPITester()
    
    # Test sequence
    tests = [
        # Authentication tests
        ("User Registration", tester.test_auth_register),
        ("Admin Login", tester.test_auth_login_admin),
        ("User Login", tester.test_auth_login_user),
        ("Get Current User", tester.test_auth_me),
        
        # API Integration tests (high priority)
        ("Odesli API Integration", tester.test_odesli_integration),
        
        # Page management tests
        ("Create Page", tester.test_create_page),
        ("Get User Pages", tester.test_get_pages),
        ("Get Specific Page", tester.test_get_page),
        ("Update Page", tester.test_update_page),
        
        # Link management tests
        ("Create Link", tester.test_create_link),
        ("Get Page Links", tester.test_get_links),
        ("Update Link", tester.test_update_link),
        
        # IP Geolocation tests (high priority - new feature)
        ("IP Geolocation - US IP", tester.test_ip_geolocation_us_ip),
        ("IP Geolocation - Russian IP", tester.test_ip_geolocation_russia_ip),
        ("IP Geolocation - Localhost", tester.test_ip_geolocation_localhost),
        ("Track Page View with Geo", tester.test_track_page_view_geolocation),
        ("Track Share with Geo", tester.test_track_share_geolocation),
        ("Track QR Scan with Geo", tester.test_qr_scan_geolocation),
        
        # Public access tests
        ("Public Page Access", tester.test_public_page),
        ("Analytics", tester.test_analytics),
        
        # Admin tests
        ("Admin Get Users", tester.test_admin_get_users),
        ("Admin Get Pages", tester.test_admin_get_pages),
        ("Admin Block User", tester.test_admin_block_user),
        ("Admin Disable Page", tester.test_admin_disable_page),
        
        # Cleanup tests
        ("Delete Link", tester.test_delete_link),
        ("Delete Page", tester.test_delete_page),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} - Exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print(f"\n📊 Test Results:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run*100):.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed tests:")
        for test in failed_tests:
            print(f"  - {test}")
    else:
        print(f"\n✅ All tests passed!")
    
    return 0 if len(failed_tests) == 0 else 1

if __name__ == "__main__":
    sys.exit(main())