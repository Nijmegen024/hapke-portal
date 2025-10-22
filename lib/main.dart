import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:url_launcher/url_launcher.dart';

void main() => runApp(const HapkeApp());

const String apiBase = 'https://hapke-backend.onrender.com';
const FlutterSecureStorage _secureStorage = FlutterSecureStorage();
const String _sessionStorageKey = 'hapke_session';
const String _lastOrderStorageKey = 'hapke_last_order';
const String _tokenStorageKey = 'hapke_access_token';

final GlobalKey<NavigatorState> appNavigatorKey = GlobalKey<NavigatorState>();

class ApiClient {
  final http.Client _client = http.Client();
  String? _token;
  Future<void> Function()? _onUnauthorized;
  bool _notifyingUnauthorized = false;

  set onUnauthorized(Future<void> Function()? callback) {
    _onUnauthorized = callback;
  }

  void setToken(String? token) {
    _token = (token != null && token.isNotEmpty) ? token : null;
  }

  void clearToken() {
    _token = null;
  }

  Future<http.Response> get(Uri uri, {Map<String, String>? headers}) {
    return _send(() {
      return _client.get(uri, headers: _buildHeaders(headers));
    });
  }

  Future<http.Response> post(
    Uri uri, {
    Map<String, String>? headers,
    Object? body,
    Encoding? encoding,
  }) {
    return _send(() {
      return _client.post(
        uri,
        headers: _buildHeaders(headers),
        body: body,
        encoding: encoding,
      );
    });
  }

  Future<http.Response> _send(Future<http.Response> Function() request) async {
    http.Response response;
    try {
      response = await request();
    } on Exception catch (e) {
      throw Exception('Verbinding mislukt: $e');
    }

    if (response.statusCode == 401 &&
        _token != null &&
        _token!.isNotEmpty &&
        !_notifyingUnauthorized) {
      _notifyingUnauthorized = true;
      try {
        if (_onUnauthorized != null) {
          await _onUnauthorized!.call();
        }
      } finally {
        _notifyingUnauthorized = false;
      }
    }
    return response;
  }

  Map<String, String> _buildHeaders(Map<String, String>? headers) {
    final merged = <String, String>{};
    if (headers != null) {
      merged.addAll(headers);
    }
    if (_token != null && _token!.isNotEmpty) {
      merged['Authorization'] = 'Bearer $_token';
    }
    return merged;
  }
}

final ApiClient apiClient = ApiClient();

/// ---------------- Models ----------------
class Restaurant {
  final String id;
  final String name;
  final String cuisine; // free text shown to user
  final String category; // one of: Cafetaria, Sushi, Gezond
  final double rating;
  final String eta; // e.g., "25–35 min"
  final List<MenuItem> menu;
  final String imageUrl;
  final double minOrder; // e.g., 15.00
  final double? deliveryFee; // null => gratis bezorging

  const Restaurant({
    required this.id,
    required this.name,
    required this.cuisine,
    required this.category,
    required this.rating,
    required this.eta,
    required this.menu,
    required this.imageUrl,
    required this.minOrder,
    this.deliveryFee, // null = gratis
  });
}

class MenuItem {
  final String id;
  final String name;
  final String description;
  final int priceCents;
  const MenuItem({
    required this.id,
    required this.name,
    required this.description,
    required this.priceCents,
  });
}

class CartItem {
  final Restaurant restaurant;
  final MenuItem item;
  int qty;
  CartItem({required this.restaurant, required this.item, this.qty = 1});
}

class HapkeUser {
  final String name;
  final String email;
  final String phone;
  final String address;
  final String gender; // "Man", "Vrouw", "Anders", "Zeg ik liever niet"
  const HapkeUser({
    required this.name,
    required this.email,
    required this.phone,
    required this.address,
    required this.gender,
  });
}

class AuthSession {
  final HapkeUser user;
  final String token;
  const AuthSession({required this.user, required this.token});
}

class OrderItemSummary {
  final String id;
  final String name;
  final int qty;
  final double price; // unit price

  const OrderItemSummary({
    required this.id,
    required this.name,
    required this.qty,
    required this.price,
  });

  double get lineTotal => price * qty;
}

class OrderStatusStepInfo {
  final String name;
  final DateTime? at;
  const OrderStatusStepInfo({required this.name, required this.at});
}

class OrderSummary {
  final String orderId;
  final String status;
  final double total;
  final int? etaMinutes;
  final DateTime createdAt;
  final List<OrderItemSummary> items;
  final List<OrderStatusStepInfo> steps;

  const OrderSummary({
    required this.orderId,
    required this.status,
    required this.total,
    required this.createdAt,
    required this.items,
    required this.steps,
    this.etaMinutes,
  });

  factory OrderSummary.fromJson(Map<String, dynamic> json) {
    final itemsJson = (json['items'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .toList();
    final stepsJson = (json['steps'] as List<dynamic>? ?? const [])
        .whereType<Map<String, dynamic>>()
        .toList();
    return OrderSummary(
      orderId: (json['orderId'] ?? '').toString(),
      status: (json['status'] ?? '').toString(),
      total: (json['total'] is num)
          ? (json['total'] as num).toDouble()
          : double.tryParse('${json['total']}') ?? 0.0,
      etaMinutes: json['etaMinutes'] is num
          ? (json['etaMinutes'] as num).round()
          : int.tryParse('${json['etaMinutes']}'),
      createdAt:
          DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
      items: itemsJson
          .map(
            (item) => OrderItemSummary(
              id: (item['id'] ?? '').toString(),
              name: (item['name'] ?? '').toString(),
              qty: item['qty'] is num
                  ? (item['qty'] as num).round()
                  : int.tryParse('${item['qty']}') ?? 0,
              price: item['price'] is num
                  ? (item['price'] as num).toDouble()
                  : double.tryParse('${item['price']}') ?? 0.0,
            ),
          )
          .toList(),
      steps: stepsJson
          .map(
            (step) => OrderStatusStepInfo(
              name: (step['name'] ?? '').toString(),
              at: DateTime.tryParse(step['at']?.toString() ?? ''),
            ),
          )
          .toList(),
    );
  }

  Map<String, dynamic> toJson() => {
    'orderId': orderId,
    'status': status,
    'total': total,
    'etaMinutes': etaMinutes,
    'createdAt': createdAt.toIso8601String(),
    'items': items
        .map(
          (item) => {
            'id': item.id,
            'name': item.name,
            'qty': item.qty,
            'price': item.price,
          },
        )
        .toList(),
    'steps': steps
        .map((step) => {'name': step.name, 'at': step.at?.toIso8601String()})
        .toList(),
  };
}

/// ---------------- Demo data ----------------
final demoRestaurants = <Restaurant>[
  Restaurant(
    id: 'r1',
    name: 'Pizzeria Napoli',
    cuisine: 'Italiaans • Pizza',
    category: 'Cafetaria',
    rating: 4.6,
    eta: '25–35 min',
    menu: const [
      MenuItem(
        id: 'm1',
        name: 'Margherita',
        description: 'Tomaat, mozzarella, basilicum',
        priceCents: 950,
      ),
      MenuItem(
        id: 'm2',
        name: 'Quattro Formaggi',
        description: 'Vier kazen, romig & rijk',
        priceCents: 1250,
      ),
      MenuItem(
        id: 'm3',
        name: 'Tiramisu',
        description: 'Huisgemaakt dessert',
        priceCents: 650,
      ),
      MenuItem(
        id: 'm15',
        name: 'Pizza Pepperoni',
        description: 'Pepperoni, mozzarella, tomaat',
        priceCents: 1150,
      ),
      MenuItem(
        id: 'm16',
        name: 'Lasagne',
        description: 'Laagjes pasta, gehakt, bechamelsaus',
        priceCents: 1200,
      ),
    ],
    imageUrl:
        'https://images.unsplash.com/photo-1542282811-943ef1a977c3?auto=format&fit=crop&w=600&q=70&sig=1001',
    minOrder: 15.00,
    deliveryFee: 2.50,
  ),
  Restaurant(
    id: 'r2',
    name: 'Sushi Nijmeegs',
    cuisine: 'Japans • Sushi',
    category: 'Sushi',
    rating: 4.4,
    eta: '30–40 min',
    menu: const [
      MenuItem(
        id: 'm4',
        name: 'Salmon Maki (8st)',
        description: 'Zalm, nori, rijst',
        priceCents: 895,
      ),
      MenuItem(
        id: 'm5',
        name: 'Spicy Tuna Roll',
        description: 'Tonijn met pit',
        priceCents: 1195,
      ),
      MenuItem(
        id: 'm6',
        name: 'Gyoza (6st)',
        description: 'Kip & groente',
        priceCents: 675,
      ),
      MenuItem(
        id: 'm17',
        name: 'California Roll',
        description: 'Krab, avocado, komkommer',
        priceCents: 995,
      ),
      MenuItem(
        id: 'm18',
        name: 'Ebi Tempura',
        description: 'Gefrituurde garnaal, saus',
        priceCents: 1095,
      ),
    ],
    imageUrl:
        'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=70&sig=1002',
    minOrder: 20.00,
    deliveryFee: null,
  ),
  Restaurant(
    id: 'r3',
    name: 'Green Bowl',
    cuisine: 'Gezond • Bowls',
    category: 'Gezond',
    rating: 4.8,
    eta: '20–30 min',
    menu: const [
      MenuItem(
        id: 'm7',
        name: 'Chicken Teriyaki Bowl',
        description: 'Rijst, kip, groenten',
        priceCents: 1095,
      ),
      MenuItem(
        id: 'm8',
        name: 'Vegan Power Bowl',
        description: 'Quinoa, kikkererwten, avocado',
        priceCents: 1195,
      ),
      MenuItem(
        id: 'm19',
        name: 'Falafel Bowl',
        description: 'Falafel, hummus, groenten',
        priceCents: 1050,
      ),
      MenuItem(
        id: 'm20',
        name: 'Salmon Poke Bowl',
        description: 'Zalm, rijst, edamame',
        priceCents: 1250,
      ),
      MenuItem(
        id: 'm21',
        name: 'Asian Beef Bowl',
        description: 'Rijst, rundvlees, teriyakisaus',
        priceCents: 1295,
      ),
    ],
    imageUrl:
        'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=70&sig=1003',
    minOrder: 12.50,
    deliveryFee: 1.50,
  ),
  Restaurant(
    id: 'r4',
    name: 'Mama Rosa Trattoria',
    cuisine: 'Italiaans • Pasta',
    category: 'Cafetaria',
    rating: 4.7,
    eta: '20–30 min',
    menu: const [
      MenuItem(
        id: 'm9',
        name: 'Pasta Bolognese',
        description: 'Rijke tomatensaus, rundergehakt, Parmezaan',
        priceCents: 1095,
      ),
      MenuItem(
        id: 'm10',
        name: 'Panna Cotta',
        description: 'Romig dessert met rood fruit',
        priceCents: 595,
      ),
      MenuItem(
        id: 'm22',
        name: 'Pasta Carbonara',
        description: 'Roomsaus, spek, Parmezaan',
        priceCents: 1150,
      ),
      MenuItem(
        id: 'm23',
        name: 'Bruschetta',
        description: 'Geroosterd brood, tomaat, basilicum',
        priceCents: 550,
      ),
      MenuItem(
        id: 'm24',
        name: 'Insalata Caprese',
        description: 'Mozzarella, tomaat, basilicum',
        priceCents: 795,
      ),
    ],
    imageUrl:
        'https://images.unsplash.com/photo-1525755662778-989d0524087e?auto=format&fit=crop&w=1200&q=80',
    minOrder: 18.00,
    deliveryFee: null,
  ),
  Restaurant(
    id: 'r5',
    name: 'Burger Bros',
    cuisine: 'Amerikaans • Burger',
    category: 'Cafetaria',
    rating: 4.5,
    eta: '15–25 min',
    menu: const [
      MenuItem(
        id: 'm11',
        name: 'Cheeseburger',
        description: 'Dubbele kaas, augurk, huisgemaakte saus',
        priceCents: 995,
      ),
      MenuItem(
        id: 'm12',
        name: 'Sweet Potato Fries',
        description: 'Krokant, met aioli',
        priceCents: 495,
      ),
      MenuItem(
        id: 'm25',
        name: 'BBQ Bacon Burger',
        description: 'Bacon, BBQ-saus, cheddar',
        priceCents: 1150,
      ),
      MenuItem(
        id: 'm26',
        name: 'Veggie Burger',
        description: 'Vegetarische burger, sla, tomaat',
        priceCents: 950,
      ),
      MenuItem(
        id: 'm27',
        name: 'Onion Rings',
        description: 'Gefrituurde uienringen, dipsaus',
        priceCents: 550,
      ),
    ],
    imageUrl:
        'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
    minOrder: 14.00,
    deliveryFee: 2.00,
  ),
  Restaurant(
    id: 'r6',
    name: 'Wok & Roll',
    cuisine: 'Aziatisch • Wok',
    category: 'Gezond',
    rating: 4.3,
    eta: '25–35 min',
    menu: const [
      MenuItem(
        id: 'm13',
        name: 'Pad Thai',
        description: 'Rijstnoedels, pinda, limoen',
        priceCents: 1095,
      ),
      MenuItem(
        id: 'm14',
        name: 'Springrolls (3st)',
        description: 'Verse groente, dipsaus',
        priceCents: 650,
      ),
      MenuItem(
        id: 'm28',
        name: 'Beef Black Pepper',
        description: 'Rundvlees, zwarte pepersaus, groenten',
        priceCents: 1195,
      ),
      MenuItem(
        id: 'm29',
        name: 'Chicken Cashew',
        description: 'Kip, cashewnoten, paprika',
        priceCents: 1150,
      ),
      MenuItem(
        id: 'm30',
        name: 'Vegetable Wok',
        description: 'Mix van seizoensgroenten, sojasaus',
        priceCents: 995,
      ),
    ],
    imageUrl:
        'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80',
    minOrder: 27.50,
    deliveryFee: 3.00,
  ),
  // --- Nieuwe restaurants ---
  Restaurant(
    id: 'r7',
    name: 'Taco Fiesta',
    cuisine: 'Mexicaans • Tacos',
    category: 'Cafetaria',
    rating: 4.2,
    eta: '20–30 min',
    menu: const [
      MenuItem(
        id: 'm31',
        name: 'Taco Carne Asada',
        description: 'Gegrild rundvlees, koriander, ui',
        priceCents: 850,
      ),
      MenuItem(
        id: 'm32',
        name: 'Taco Pollo',
        description: 'Kip, salsa, kaas',
        priceCents: 800,
      ),
      MenuItem(
        id: 'm33',
        name: 'Nachos Supreme',
        description: 'Nacho\'s, kaas, jalapeños, guacamole',
        priceCents: 950,
      ),
      MenuItem(
        id: 'm34',
        name: 'Quesadilla',
        description: 'Tortilla, kaas, groenten',
        priceCents: 900,
      ),
      MenuItem(
        id: 'm35',
        name: 'Churros',
        description: 'Gefrituurde deegstengels, kaneelsuiker',
        priceCents: 550,
      ),
    ],
    imageUrl:
        'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=70',
    minOrder: 13.00,
    deliveryFee: 1.80,
  ),
  Restaurant(
    id: 'r8',
    name: 'Vegan Vibes',
    cuisine: 'Veganistisch • Gezond',
    category: 'Gezond',
    rating: 4.9,
    eta: '18–28 min',
    menu: const [
      MenuItem(
        id: 'm36',
        name: 'Vegan Burger',
        description: 'Plantaardige burger, vegan mayo, sla',
        priceCents: 1050,
      ),
      MenuItem(
        id: 'm37',
        name: 'Jackfruit Wrap',
        description: 'Jackfruit, groenten, hummus',
        priceCents: 995,
      ),
      MenuItem(
        id: 'm38',
        name: 'Rainbow Salad',
        description: 'Kleurige groenten, noten, vinaigrette',
        priceCents: 895,
      ),
      MenuItem(
        id: 'm39',
        name: 'Vegan Brownie',
        description: 'Chocolade, noten, veganistisch',
        priceCents: 550,
      ),
      MenuItem(
        id: 'm40',
        name: 'Smoothie Bowl',
        description: 'Fruit, granola, kokos',
        priceCents: 750,
      ),
    ],
    imageUrl:
        'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=600&q=70',
    minOrder: 10.00,
    deliveryFee: null,
  ),
  Restaurant(
    id: 'r9',
    name: 'Mootje',
    cuisine: 'Je lokale drugsdealer',
    category: 'Cafetaria',
    rating: 4.1,
    eta: '15–25 min',
    menu: const [
      MenuItem(
        id: 'm41',
        name: 'SOS',
        description: 'Snelle snack voor als het even tegenzit',
        priceCents: 650,
      ),
      MenuItem(
        id: 'm42',
        name: 'Miuaw',
        description: 'Zachte bite met een speelse kick',
        priceCents: 725,
      ),
      MenuItem(
        id: 'm43',
        name: 'Keeetaah',
        description: 'Kruidige favoriet waar je van gaat spinnen',
        priceCents: 775,
      ),
      MenuItem(
        id: 'm44',
        name: 'Sterooids',
        description: 'Powerdrank voor de late uurtjes',
        priceCents: 850,
      ),
      MenuItem(
        id: 'm45',
        name: 'Kopje Koffie En Een Goed Gesprek',
        description: 'Sterke koffie met tijd voor een praatje',
        priceCents: 450,
      ),
    ],
    imageUrl:
        'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80',
    minOrder: 11.00,
    deliveryFee: 1.20,
  ),
];

// Images per gerecht (fallback naar restaurantfoto als ontbreekt)
const Map<String, String> _dishImages = {
  // Pizzeria Napoli
  'm1':
      'https://picsum.photos/seed/hapke-margherita/1200/800', // Margherita (stable placeholder)
  // Quattro Formaggi - unique quattro formaggi pizza photo
  'm2':
      'https://images.unsplash.com/photo-1519864600265-abb23847ef2c?auto=format&fit=crop&w=1200&q=80', // Quattro Formaggi
  // Tiramisu - unique tiramisu dessert photo
  'm3':
      'https://images.unsplash.com/photo-1504674900247-eca3c9b11030?auto=format&fit=crop&w=1200&q=80', // Tiramisu
  'm15':
      'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Pepperoni_pizza.jpg/1200px-Pepperoni_pizza.jpg', // Pepperoni
  'm16':
      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Lasagne_-_stonesoup.jpg/1200px-Lasagne_-_stonesoup.jpg', // Lasagne
  // Sushi Nijmeegs
  'm4':
      'https://images.unsplash.com/photo-1553621042-f6e147245754?auto=format&fit=crop&w=1200&q=80', // Salmon maki
  'm5':
      'https://images.unsplash.com/photo-1546069901-5eb8352d3f71?auto=format&fit=crop&w=1200&q=80', // Spicy tuna (alt)
  'm6':
      'https://images.unsplash.com/photo-1604908554028-8d6b4d0f5ae1?auto=format&fit=crop&w=1200&q=80', // Gyoza
  'm17':
      'https://images.unsplash.com/photo-1562158070-4b77b1b86be5?auto=format&fit=crop&w=1200&q=80', // California roll
  'm18':
      'https://images.unsplash.com/photo-1605478371310-771b1e20b0d1?auto=format&fit=crop&w=1200&q=80', // Ebi tempura
  // Green Bowl
  'm7':
      'https://images.unsplash.com/photo-1526318472351-c75fcf070305?auto=format&fit=crop&w=1200&q=80',
  'm8':
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
  'm19':
      'https://images.unsplash.com/photo-1512621776951-8da5fd7f7f3c?auto=format&fit=crop&w=1200&q=80',
  'm20':
      'https://images.unsplash.com/photo-1546069901-5eb8352d3f71?auto=format&fit=crop&w=1200&q=80',
  'm21':
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=80',
  // Mama Rosa
  'm9':
      'https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?auto=format&fit=crop&w=1200&q=80',
  'm10':
      'https://images.unsplash.com/photo-1551024709-8f23befc6cf7?auto=format&fit=crop&w=1200&q=80',
  'm22':
      'https://images.unsplash.com/photo-1523986371872-9d3ba2e2f642?auto=format&fit=crop&w=1200&q=80',
  'm23':
      'https://images.unsplash.com/photo-1523986371872-5a1b1b2a9c2a?auto=format&fit=crop&w=1200&q=80',
  'm24':
      'https://images.unsplash.com/photo-1523986371872-7bcd2e2f6420?auto=format&fit=crop&w=1200&q=80',
  // Burger Bros
  'm11':
      'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
  'm12':
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80',
  'm25':
      'https://images.unsplash.com/photo-1550317138-10000687a72b?auto=format&fit=crop&w=1200&q=80',
  'm26':
      'https://images.unsplash.com/photo-1499028344343-cd173ffc68a9?auto=format&fit=crop&w=1200&q=80',
  'm27':
      'https://images.unsplash.com/photo-1498654077810-12f29c4aee5e?auto=format&fit=crop&w=1200&q=80',
  // Wok & Roll
  'm13':
      'https://images.unsplash.com/photo-1604908554161-5a7b6e0a7c5b?auto=format&fit=crop&w=1200&q=80',
  'm14':
      'https://images.unsplash.com/photo-1601050690597-9f05f9f3f6c3?auto=format&fit=crop&w=1200&q=80',
  'm28':
      'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?auto=format&fit=crop&w=1200&q=80',
  'm29':
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1200&q=80',
  'm30':
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
  // Taco Fiesta
  'm31':
      'https://images.unsplash.com/photo-1617191517309-5b6f9f09a9f1?auto=format&fit=crop&w=1200&q=80',
  'm32':
      'https://images.unsplash.com/photo-1601050690597-9f05f9f3f6c3?auto=format&fit=crop&w=1200&q=80',
  'm33':
      'https://images.unsplash.com/photo-1604908554028-8d6b4d0f5ae1?auto=format&fit=crop&w=1200&q=80',
  'm34':
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
  'm35':
      'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1200&q=80',
  // Vegan Vibes
  'm36':
      'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=1200&q=80',
  'm37':
      'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=1200&q=80',
  'm38':
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1200&q=80',
  'm39':
      'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?auto=format&fit=crop&w=1200&q=80',
  'm40':
      'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1200&q=80',
  // Mootje
  'm41':
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=1200&q=80',
  'm42':
      'https://images.unsplash.com/photo-1482049016688-2d3e1b311543?auto=format&fit=crop&w=1200&q=80',
  'm43':
      'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=1200&q=80',
  'm44':
      'https://images.unsplash.com/photo-1577805947697-89e18249d767?auto=format&fit=crop&w=1200&q=80',
  'm45':
      'https://images.unsplash.com/photo-1523949344631-1f58916912fa?auto=format&fit=crop&w=1200&q=80',
};

/// ---------------- Simple in-memory inbox for demo ----------------
class AppInbox {
  static final List<String> friends = ['Job', 'Sofia', 'Matrijn'];
  static final Map<String, List<String>> messages = <String, List<String>>{};
  static final Map<String, int> unread = <String, int>{};
  static final ValueNotifier<int> tick = ValueNotifier<int>(0);

  static void sendToFriend(String friend, String text) {
    messages.putIfAbsent(friend, () => <String>[]).add(text);
    unread[friend] = (unread[friend] ?? 0) + 1;
    tick.value++;
  }

  static List<String> getConversation(String friend) =>
      List<String>.from(messages[friend] ?? const []);
  static int getUnread(String friend) => unread[friend] ?? 0;
  static void markRead(String friend) {
    unread[friend] = 0;
    tick.value++;
  }
}

/// ---------------- App root with state ----------------
class HapkeApp extends StatefulWidget {
  const HapkeApp({super.key});
  @override
  State<HapkeApp> createState() => _HapkeAppState();
}

class _HapkeAppState extends State<HapkeApp> {
  final List<CartItem> _cart = [];
  HapkeUser? _user; // null = niet ingelogd
  String? _authToken;
  String? _pendingOrderId;
  bool _handlingUnauthorized = false;

  int get cartCount => _cart.fold(0, (n, ci) => n + ci.qty);
  int get cartTotalCents =>
      _cart.fold(0, (sum, ci) => sum + ci.item.priceCents * ci.qty);

  @override
  void initState() {
    super.initState();
    apiClient.onUnauthorized = _handleUnauthorized;
    Future.microtask(() async {
      await _restoreSession();
      await _restorePendingOrder();
    });
  }

  void addToCart(Restaurant r, MenuItem m) {
    final existing = _cart.where(
      (ci) => ci.item.id == m.id && ci.restaurant.id == r.id,
    );
    if (existing.isNotEmpty) {
      setState(() => existing.first.qty += 1);
    } else {
      setState(() => _cart.add(CartItem(restaurant: r, item: m)));
    }
  }

  void updateQty(CartItem ci, int newQty) {
    setState(() {
      ci.qty = newQty.clamp(0, 999);
      _cart.removeWhere((e) => e.qty == 0);
    });
  }

  void clearCart() => setState(_cart.clear);

  void setSession(AuthSession session) {
    setState(() {
      _user = session.user;
      _authToken = session.token;
    });
    _persistSession(session);
    _persistToken(session.token);
    apiClient.setToken(session.token);
  }

  Future<void> logout() async {
    apiClient.clearToken();
    await _clearTokenStorage();
    await _clearSessionStorage();
    await _clearLastOrder();
    if (!mounted) return;
    setState(() {
      _user = null;
      _authToken = null;
      _pendingOrderId = null;
    });
  }

  Future<void> _persistSession(AuthSession session) async {
    final payload = jsonEncode({
      'user': {
        'name': session.user.name,
        'email': session.user.email,
        'phone': session.user.phone,
        'address': session.user.address,
        'gender': session.user.gender,
      },
    });
    try {
      await _secureStorage.write(key: _sessionStorageKey, value: payload);
    } catch (e) {
      debugPrint('Kon sessie niet bewaren: $e');
    }
  }

  Future<void> _persistToken(String token) async {
    try {
      await _secureStorage.write(key: _tokenStorageKey, value: token);
    } catch (e) {
      debugPrint('Kon token niet bewaren: $e');
    }
  }

  Future<void> _clearTokenStorage() async {
    try {
      await _secureStorage.delete(key: _tokenStorageKey);
    } catch (e) {
      debugPrint('Kon token niet verwijderen: $e');
    }
  }

  Future<void> _clearSessionStorage() async {
    try {
      await _secureStorage.delete(key: _sessionStorageKey);
    } catch (e) {
      debugPrint('Kon sessie niet verwijderen: $e');
    }
  }

  Future<void> _restoreSession() async {
    try {
      String? token = await _secureStorage.read(key: _tokenStorageKey);
      final stored = await _secureStorage.read(key: _sessionStorageKey);
      Map<String, dynamic> userData = const {};
      if (stored != null && stored.isNotEmpty) {
        try {
          final data = jsonDecode(stored) as Map<String, dynamic>;
          userData = (data['user'] as Map<String, dynamic>? ?? const {});
          if ((token == null || token.isEmpty) && data['token'] != null) {
            token = (data['token'] ?? '').toString();
          }
        } catch (e) {
          debugPrint('Kon sessie-data niet parsen: $e');
        }
      }
      if (token == null || token.isEmpty) return;
      apiClient.setToken(token);
      final restoredUser = HapkeUser(
        name: (userData['name'] ?? '').toString(),
        email: (userData['email'] ?? '').toString(),
        phone: (userData['phone'] ?? '').toString(),
        address: (userData['address'] ?? '').toString(),
        gender: (userData['gender'] ?? 'Zeg ik liever niet').toString(),
      );
      if (!mounted) return;
      setState(() {
        _user = restoredUser;
        _authToken = token;
      });
      // Laat kort weten dat de sessie is hersteld
      final ctx = appNavigatorKey.currentContext;
      if (ctx != null) {
        final String naam = restoredUser.name.isNotEmpty ? restoredUser.name : 'gebruiker';
        ScaffoldMessenger.of(ctx).showSnackBar(
          SnackBar(content: Text('Welkom terug, $naam')),
        );
      }
    } catch (e) {
      debugPrint('Kon sessie niet herstellen: $e');
    }
  }

  Future<void> _saveLastOrder(String orderId) async {
    try {
      await _secureStorage.write(key: _lastOrderStorageKey, value: orderId);
    } catch (e) {
      debugPrint('Kon order niet bewaren: $e');
    }
  }

  Future<void> _clearLastOrder() async {
    try {
      await _secureStorage.delete(key: _lastOrderStorageKey);
    } catch (e) {
      debugPrint('Kon order niet verwijderen: $e');
    }
  }

  Future<void> _restorePendingOrder() async {
    try {
      final stored = await _secureStorage.read(key: _lastOrderStorageKey);
      if (!mounted || stored == null || stored.isEmpty) return;
      setState(() {
        _pendingOrderId = stored;
      });
    } catch (e) {
      debugPrint('Kon order niet herstellen: $e');
    }
  }

  Future<void> _handleOrderPlaced(OrderSummary summary) async {
    setState(() {
      _pendingOrderId = summary.orderId;
    });
    await _saveLastOrder(summary.orderId);
  }

  Future<void> _handleOrderDelivered(String orderId) async {
    await _clearLastOrder();
    if (!mounted) return;
    if (_pendingOrderId == orderId) {
      setState(() {
        _pendingOrderId = null;
      });
    }
  }

  Future<void> _handleUnauthorized() async {
    if (_handlingUnauthorized) return;
    _handlingUnauthorized = true;
    await logout();
    final context = appNavigatorKey.currentContext;
    if (context != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Sessie verlopen. Log opnieuw in.')),
      );
      final session = await appNavigatorKey.currentState?.push<AuthSession>(
        MaterialPageRoute(builder: (_) => const LoginPage()),
      );
      if (session != null) {
        setSession(session);
      }
    }
    _handlingUnauthorized = false;
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Hapke',
      debugShowCheckedModeBanner: false,
      navigatorKey: appNavigatorKey,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF0A2342),
          brightness: Brightness.light,
        ),
        scaffoldBackgroundColor: Colors.white,
        appBarTheme: const AppBarTheme(
          centerTitle: true,
          elevation: 0,
          backgroundColor: Color(0xFF0A2342),
          foregroundColor: Colors.white,
          systemOverlayStyle: SystemUiOverlayStyle.light,
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            minimumSize: const Size(40, 40),
            backgroundColor: const Color(0xFFE53935), // Hapke Red
            foregroundColor: Colors.white,
          ),
        ),
        outlinedButtonTheme: OutlinedButtonThemeData(
          style: OutlinedButton.styleFrom(
            foregroundColor: const Color(0xFFE53935),
            side: const BorderSide(color: Color(0xFFE53935)),
          ),
        ),
        cardTheme: CardThemeData(
          surfaceTintColor: Colors.white,
          color: Colors.white,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(12),
          ),
        ),
        chipTheme: ChipThemeData(
          backgroundColor: const Color(0xFF0A2342),
          selectedColor: const Color(0xFF0A2342),
          labelStyle: const TextStyle(color: Colors.white),
          secondarySelectedColor: const Color(0xFF0A2342),
        ),
        bottomNavigationBarTheme: const BottomNavigationBarThemeData(
          backgroundColor: Color(0xFF0A2342),
          selectedItemColor: Colors.white,
          unselectedItemColor: Colors.white70,
          selectedLabelStyle: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
          ),
          unselectedLabelStyle: TextStyle(fontSize: 12),
          showUnselectedLabels: true,
        ),
      ),
      home: _RootTabs(
        restaurants: demoRestaurants,
        cartItems: _cart,
        cartTotalCents: cartTotalCents,
        onAdd: addToCart,
        onUpdateQty: updateQty,
        onClear: clearCart,
        onLoggedIn: setSession,
        onLogout: logout,
        currentUser: _user,
        authToken: _authToken,
        onOrderPlaced: _handleOrderPlaced,
        pendingOrderId: _pendingOrderId,
        onTrackingCompleted: _handleOrderDelivered,
      ),
    );
  }
}

class _RootTabs extends StatefulWidget {
  final List<Restaurant> restaurants;
  final List<CartItem> cartItems;
  final int cartTotalCents;
  final void Function(Restaurant, MenuItem) onAdd;
  final void Function(CartItem, int) onUpdateQty;
  final VoidCallback onClear;
  final void Function(AuthSession) onLoggedIn;
  final Future<void> Function() onLogout;
  final HapkeUser? currentUser;
  final String? authToken;
  final Future<void> Function(OrderSummary summary) onOrderPlaced;
  final Future<void> Function(String orderId) onTrackingCompleted;
  final String? pendingOrderId;
  const _RootTabs({
    required this.restaurants,
    required this.cartItems,
    required this.cartTotalCents,
    required this.onAdd,
    required this.onUpdateQty,
    required this.onClear,
    required this.onLoggedIn,
    required this.onLogout,
    required this.currentUser,
    required this.authToken,
    required this.onOrderPlaced,
    required this.onTrackingCompleted,
    required this.pendingOrderId,
  });
  @override
  State<_RootTabs> createState() => _RootTabsState();
}

class _RootTabsState extends State<_RootTabs> {
  int _index = 0;
  bool _restoredTracking = false;

  @override
  void initState() {
    super.initState();
    _maybeResumeTracking();
  }

  @override
  void didUpdateWidget(covariant _RootTabs oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.pendingOrderId != oldWidget.pendingOrderId ||
        widget.authToken != oldWidget.authToken) {
      _restoredTracking = false;
      _maybeResumeTracking();
    }
  }

  void _maybeResumeTracking() {
    if (_restoredTracking) return;
    final orderId = widget.pendingOrderId;
    if (orderId == null || orderId.isEmpty) return;
    final token = widget.authToken;
    if (token == null || token.isEmpty) return;
    _restoredTracking = true;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      _openTracking(
        orderId: orderId,
        status: null,
        etaMinutes: null,
        steps: const [],
      );
    });
  }

  Future<void> _checkout(BuildContext context) async {
    if (widget.cartItems.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('MANDDD!! is leeg')));
      return;
    }
    final cartSnapshot = widget.cartItems
        .map(
          (ci) =>
              CartItem(restaurant: ci.restaurant, item: ci.item, qty: ci.qty),
        )
        .toList();
    final totalCents = cartSnapshot.fold(
      0,
      (sum, ci) => sum + ci.item.priceCents * ci.qty,
    );
    final result = await Navigator.of(context).push<Map<String, dynamic>>(
      MaterialPageRoute(
        builder: (_) => PaymentMethodPage(
          items: cartSnapshot,
          totalCents: totalCents,
          authToken: widget.authToken,
          email: widget.currentUser?.email,
        ),
      ),
    );
    if (!context.mounted || result == null) return;
    final summary = OrderSummary.fromJson(result);
    await widget.onOrderPlaced(summary);
    widget.onClear();
    if (!context.mounted) return;
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => OrderConfirmationPage(
          summary: summary,
          onTrack: () => _openTracking(
            orderId: summary.orderId,
            status: summary.status,
            etaMinutes: summary.etaMinutes,
            steps: summary.steps,
          ),
        ),
      ),
    );
  }

  Future<void> _openTracking({
    required String orderId,
    String? status,
    int? etaMinutes,
    List<OrderStatusStepInfo> steps = const [],
  }) async {
    if (!mounted) return;
    await Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => OrderTrackingPage(
          orderId: orderId,
          authToken: widget.authToken,
          initialStatus: status,
          initialEtaMinutes: etaMinutes,
          initialSteps: steps,
          onDelivered: () async {
            await widget.onTrackingCompleted(orderId);
          },
          onOrderMissing: () async {
            await widget.onTrackingCompleted(orderId);
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Bestelling niet gevonden')),
              );
            }
          },
          onConnectionError: () {
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Geen verbinding. Probeer opnieuw'),
                ),
              );
            }
          },
        ),
      ),
    );
  }

  Future<void> _openCartModal(BuildContext context) {
    return Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => CartPage(
          items: widget.cartItems,
          totalCents: widget.cartItems.fold(
            0,
            (s, ci) => s + ci.item.priceCents * ci.qty,
          ),
          onUpdateQty: widget.onUpdateQty,
          onCheckout: () => _checkout(context),
          onClear: widget.onClear,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      HomePage(
        restaurants: widget.restaurants,
        cartCount: widget.cartItems.fold(0, (n, ci) => n + ci.qty),
        currentUser: widget.currentUser,
        openCartModal: _openCartModal,
        addToCart: widget.onAdd,
        onUpdateQty: widget.onUpdateQty,
        onClearCart: widget.onClear,
        cartItems: widget.cartItems,
        onLoggedIn: widget.onLoggedIn,
        onLogout: widget.onLogout,
      ),
      VideosTab(
        restaurants: widget.restaurants,
        onAdd: widget.onAdd,
        cartItems: widget.cartItems,
        openCartModal: _openCartModal,
      ),
      CartPage(
        items: widget.cartItems,
        totalCents: widget.cartItems.fold(
          0,
          (s, ci) => s + ci.item.priceCents * ci.qty,
        ),
        onUpdateQty: widget.onUpdateQty,
        onCheckout: () => _checkout(context),
        onClear: widget.onClear,
      ),
      const FriendsTab(),
      _AccountTab(
        user: widget.currentUser,
        onLogin: () async {
          final result = await Navigator.of(context).push<AuthSession>(
            MaterialPageRoute(builder: (_) => const LoginPage()),
          );
          if (result != null) widget.onLoggedIn(result);
          setState(() {});
        },
        onLogout: widget.onLogout,
      ),
    ];

    return Scaffold(
      body: IndexedStack(index: _index, children: pages),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        backgroundColor: const Color(0xFF0A2342),
        selectedItemColor: Colors.white,
        unselectedItemColor: Colors.white70,
        selectedFontSize: 12,
        unselectedFontSize: 12,
        currentIndex: _index,
        onTap: (i) => setState(() => _index = i),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.explore_outlined),
            label: 'Ontdek',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.ondemand_video_outlined),
            label: "Video's",
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.shopping_bag_outlined),
            label: 'MANDDD!!',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.group_outlined),
            label: 'Vrienden',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            label: 'Account',
          ),
        ],
      ),
    );
  }
}

class _AccountTab extends StatelessWidget {
  final HapkeUser? user;
  final VoidCallback onLogin;
  final Future<void> Function()? onLogout;
  const _AccountTab({
    required this.user,
    required this.onLogin,
    required this.onLogout,
  });
  @override
  Widget build(BuildContext context) {
    if (user == null) {
      return Center(
        child: ElevatedButton.icon(
          onPressed: onLogin,
          icon: const Icon(Icons.login),
          label: const Text('Inloggen / Aanmelden'),
        ),
      );
    }
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 20),
          Text(
            'Welkom, ${user!.name}',
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: 12),
          Text('${user!.email}\n${user!.phone}\n${user!.address}'),
          const Spacer(),
          ElevatedButton.icon(
            onPressed: onLogout == null
                ? null
                : () async {
                    await onLogout!();
                  },
            icon: const Icon(Icons.logout),
            label: const Text('Uitloggen'),
          ),
          const SizedBox(height: 20),
        ],
      ),
    );
  }
}

/// ---------------- Screens ----------------
class HomePage extends StatefulWidget {
  final List<Restaurant> restaurants;
  final int cartCount;
  final HapkeUser? currentUser;
  final Future<void> Function(BuildContext) openCartModal;
  final void Function(Restaurant, MenuItem) addToCart;
  final void Function(CartItem, int) onUpdateQty;
  final VoidCallback onClearCart;
  final List<CartItem> cartItems;
  final void Function(AuthSession) onLoggedIn;
  final Future<void> Function() onLogout;

  const HomePage({
    super.key,
    required this.restaurants,
    required this.cartCount,
    required this.currentUser,
    required this.openCartModal,
    required this.addToCart,
    required this.onUpdateQty,
    required this.onClearCart,
    required this.cartItems,
    required this.onLoggedIn,
    required this.onLogout,
  });

  @override
  State<HomePage> createState() => _HomePageState();
}

class _HomePageState extends State<HomePage> {
  String _query = '';
  String? _selectedCategory; // 'Cafetaria', 'Sushi', 'Gezond' of null (alles)
  // Kleine thumbnails voor de categorieknoppen
  final Map<String, String> _chipIcons = {
    'Cafetaria':
        'https://images.unsplash.com/photo-1520072959219-c595dc870360?auto=format&fit=crop&w=120&q=60',
    'Sushi':
        'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?auto=format&fit=crop&w=120&q=60',
    'Gezond':
        'https://images.unsplash.com/photo-1543353071-10c8ba85a904?auto=format&fit=crop&w=120&q=60',
  };

  Future<void> _openCart(BuildContext context) async {
    await widget.openCartModal(context);
    if (mounted) setState(() {});
  }

  void _openRestaurant(BuildContext context, Restaurant r) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => RestaurantDetailPage(
          restaurant: r,
          cartItems: widget.cartItems,
          onAdd: (m) {
            widget.addToCart(r, m);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('${m.name} toegevoegd aan MANDDD!!'),
                duration: const Duration(milliseconds: 900),
              ),
            );
            setState(() {}); // badge bijwerken
          },
          openCartModal: widget.openCartModal,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // filteren op zoekterm + categorie
    final filtered = widget.restaurants.where((r) {
      final q = _query.toLowerCase();
      final matchesQuery =
          r.name.toLowerCase().contains(q) ||
          r.cuisine.toLowerCase().contains(q);
      final matchesCategory =
          _selectedCategory == null || r.category == _selectedCategory;
      return matchesQuery && matchesCategory;
    }).toList();

    final cartCountTotal = widget.cartItems.fold<int>(0, (n, ci) => n + ci.qty);
    final cartTotalCents = widget.cartItems.fold<int>(
      0,
      (s, ci) => s + ci.item.priceCents * ci.qty,
    );

    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A2342),
        clipBehavior: Clip.none,
        title: Transform.scale(
          scale: 1.4,
          child: SizedBox(
            height: kToolbarHeight,
            child: Image.asset(
              'assets/icons/hapke_logo.png',
              fit: BoxFit.contain,
              errorBuilder: (_, __, ___) => const Center(
                child: Text(
                  'Hapke',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ),
        ),
        centerTitle: true,
      ),
      // Sticky cart bar when items exist
      bottomSheet: widget.cartItems.isEmpty
          ? null
          : StickyCartBar(
              totalCents: cartTotalCents,
              itemCount: cartCountTotal,
              onTap: () => _openCart(context),
            ),
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            floating: true,
            snap: true,
            backgroundColor: const Color(0xFF0A2342),
            iconTheme: const IconThemeData(color: Colors.white),
            titleTextStyle: const TextStyle(
              color: Colors.white,
              fontSize: 18,
              fontWeight: FontWeight.w600,
            ),
            title: _SearchPill(onChanged: (v) => setState(() => _query = v)),
          ),
          SliverToBoxAdapter(
            child: SizedBox(
              height: 50,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                children: [
                  _CategoryChip(
                    label: 'Cafetaria',
                    iconUrl: _chipIcons['Cafetaria'],
                    selected: _selectedCategory == 'Cafetaria',
                    onSelected: () => setState(
                      () => _selectedCategory == 'Cafetaria'
                          ? _selectedCategory = null
                          : _selectedCategory = 'Cafetaria',
                    ),
                  ),
                  _CategoryChip(
                    label: 'Sushi',
                    iconUrl: _chipIcons['Sushi'],
                    selected: _selectedCategory == 'Sushi',
                    onSelected: () => setState(
                      () => _selectedCategory == 'Sushi'
                          ? _selectedCategory = null
                          : _selectedCategory = 'Sushi',
                    ),
                  ),
                  _CategoryChip(
                    label: 'Gezond',
                    iconUrl: _chipIcons['Gezond'],
                    selected: _selectedCategory == 'Gezond',
                    onSelected: () => setState(
                      () => _selectedCategory == 'Gezond'
                          ? _selectedCategory = null
                          : _selectedCategory = 'Gezond',
                    ),
                  ),
                ],
              ),
            ),
          ),
          SliverList(
            delegate: SliverChildBuilderDelegate((context, i) {
              final r = filtered[i];
              return InkWell(
                onTap: () => _openRestaurant(context, r),
                child: Padding(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  child: Card(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        AspectRatio(
                          aspectRatio: 16 / 9,
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Stack(
                              fit: StackFit.expand,
                              children: [
                                Hero(
                                  tag: 'rest_${r.id}',
                                  child: Image.network(
                                    r.imageUrl,
                                    fit: BoxFit.cover,
                                    errorBuilder: (_, __, ___) =>
                                        const ColoredBox(
                                          color: Colors.black12,
                                          child: Center(
                                            child: Icon(
                                              Icons.storefront,
                                              size: 40,
                                            ),
                                          ),
                                        ),
                                  ),
                                ),
                                Positioned(
                                  left: 8,
                                  right: 8,
                                  bottom: 8,
                                  child: Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 8,
                                      vertical: 6,
                                    ),
                                    decoration: BoxDecoration(
                                      color: Colors.black54,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Row(
                                          children: [
                                            const Icon(
                                              Icons.star,
                                              size: 16,
                                              color: Colors.amber,
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              r.rating.toStringAsFixed(1),
                                              style: const TextStyle(
                                                color: Colors.white,
                                              ),
                                            ),
                                            const SizedBox(width: 12),
                                            const Icon(
                                              Icons.timer,
                                              size: 16,
                                              color: Colors.white,
                                            ),
                                            const SizedBox(width: 4),
                                            Text(
                                              r.eta,
                                              style: const TextStyle(
                                                color: Colors.white,
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 6),
                                        Wrap(
                                          crossAxisAlignment:
                                              WrapCrossAlignment.center,
                                          spacing: 12,
                                          runSpacing: 4,
                                          children: [
                                            Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                const Icon(
                                                  Icons
                                                      .shopping_basket_outlined,
                                                  size: 16,
                                                  color: Colors.white,
                                                ),
                                                const SizedBox(width: 4),
                                                Text(
                                                  'Min. ' +
                                                      _formatEuros(r.minOrder),
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                  ),
                                                ),
                                              ],
                                            ),
                                            Row(
                                              mainAxisSize: MainAxisSize.min,
                                              children: [
                                                const Icon(
                                                  Icons.pedal_bike,
                                                  size: 16,
                                                  color: Colors.white,
                                                ),
                                                const SizedBox(width: 4),
                                                Text(
                                                  r.deliveryFee == null
                                                      ? 'Gratis bezorging'
                                                      : _formatEuros(
                                                              r.deliveryFee!,
                                                            ) +
                                                            ' bezorging',
                                                  style: const TextStyle(
                                                    color: Colors.white,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ],
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.fromLTRB(12, 12, 12, 12),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                r.name,
                                style: const TextStyle(
                                  fontSize: 16,
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                r.cuisine,
                                style: TextStyle(color: Colors.grey.shade800),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              );
            }, childCount: filtered.length),
          ),
          const SliverToBoxAdapter(child: SizedBox(height: 100)),
        ],
      ),
    );
  }
}

class RestaurantDetailPage extends StatefulWidget {
  final Restaurant restaurant;
  final void Function(MenuItem) onAdd;
  final Future<void> Function(BuildContext) openCartModal;
  final List<CartItem> cartItems;

  const RestaurantDetailPage({
    super.key,
    required this.restaurant,
    required this.onAdd,
    required this.openCartModal,
    required this.cartItems,
  });

  @override
  State<RestaurantDetailPage> createState() => _RestaurantDetailPageState();
}

class _RestaurantDetailPageState extends State<RestaurantDetailPage> {
  Future<void> _openCart() async {
    await widget.openCartModal(context);
    if (mounted) setState(() {});
  }

  void _handleAdd(MenuItem m) {
    widget.onAdd(m);
    if (!mounted) return;
    setState(() {});
    final messenger = ScaffoldMessenger.of(context);
    messenger.hideCurrentSnackBar();
    messenger.showSnackBar(
      SnackBar(
        content: Text('${m.name} toegevoegd aan MANDDD!!'),
        duration: const Duration(milliseconds: 900),
        action: SnackBarAction(
          label: 'MANDDD!!',
          onPressed: () {
            _openCart();
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cartCount = widget.cartItems.fold(0, (n, ci) => n + ci.qty);
    final totalCents = widget.cartItems.fold(
      0,
      (s, ci) => s + ci.item.priceCents * ci.qty,
    );
    final bottomPadding = cartCount > 0 ? 120.0 : 12.0;
    final cartItemsThisRestaurant = widget.cartItems
        .where((ci) => ci.restaurant.id == widget.restaurant.id)
        .toList();
    final otherCartItems = widget.cartItems
        .where((ci) => ci.restaurant.id != widget.restaurant.id)
        .toList();
    final previewItems = <CartItem>[
      ...cartItemsThisRestaurant,
      ...otherCartItems,
    ];
    final visibleItems = previewItems.take(4).toList();
    final remainingItems = previewItems.length - visibleItems.length;

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.restaurant.name),
        actions: [
          IconButton(
            onPressed: () async => _openCart(),
            icon: Stack(
              clipBehavior: Clip.none,
              children: [
                const Icon(Icons.shopping_bag_outlined),
                if (cartCount > 0)
                  Positioned(
                    right: -6,
                    top: -6,
                    child: _Badge(count: cartCount),
                  ),
              ],
            ),
          ),
        ],
      ),
      bottomSheet: cartCount == 0
          ? null
          : StickyCartBar(
              totalCents: totalCents,
              itemCount: cartCount,
              onTap: () async => _openCart(),
            ),
      body: ListView.separated(
        padding: EdgeInsets.fromLTRB(12, 12, 12, bottomPadding),
        itemCount: widget.restaurant.menu.length + 1,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, i) {
          if (i == 0) {
            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: AspectRatio(
                    aspectRatio: 16 / 9,
                    child: Hero(
                      tag: 'rest_${widget.restaurant.id}',
                      child: Image.network(
                        widget.restaurant.imageUrl,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    const Icon(Icons.shopping_basket_outlined, size: 18),
                    const SizedBox(width: 6),
                    Text('Min. ' + _formatEuros(widget.restaurant.minOrder)),
                    const SizedBox(width: 16),
                    const Icon(Icons.pedal_bike, size: 18),
                    const SizedBox(width: 6),
                    Text(
                      widget.restaurant.deliveryFee == null
                          ? 'Gratis bezorging'
                          : '${_formatEuros(widget.restaurant.deliveryFee!)} bezorging',
                    ),
                  ],
                ),
                if (previewItems.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Card(
                    elevation: 2,
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Je MANDDD!!',
                                style: TextStyle(fontWeight: FontWeight.w700),
                              ),
                              Text(
                                _formatPrice(totalCents),
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          ...visibleItems.map(
                            (ci) => Padding(
                              padding: const EdgeInsets.symmetric(vertical: 4),
                              child: Row(
                                mainAxisAlignment:
                                    MainAxisAlignment.spaceBetween,
                                children: [
                                  Expanded(
                                    child: Text(
                                      '${ci.qty}× ${ci.item.name}' +
                                          (ci.restaurant.id ==
                                                  widget.restaurant.id
                                              ? ''
                                              : ' • ${ci.restaurant.name}'),
                                      style: TextStyle(
                                        color:
                                            ci.restaurant.id ==
                                                widget.restaurant.id
                                            ? Colors.black
                                            : Colors.black54,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(
                                    _formatPrice(ci.item.priceCents * ci.qty),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          if (remainingItems > 0)
                            Padding(
                              padding: const EdgeInsets.only(top: 6),
                              child: Text(
                                '+ $remainingItems extra ${remainingItems == 1 ? 'item' : 'items'}',
                                style: const TextStyle(
                                  color: Colors.black54,
                                  fontSize: 12,
                                ),
                              ),
                            ),
                          const SizedBox(height: 8),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton.icon(
                              onPressed: () => _openCart(),
                              icon: const Icon(Icons.shopping_bag_outlined),
                              label: const Text('Bekijk MANDDD!!'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            );
          }
          final m = widget.restaurant.menu[i - 1];
          return Card(
            color: const Color(0xFF0A2342),
            child: ListTile(
              dense: true,
              contentPadding: const EdgeInsets.symmetric(
                vertical: 6,
                horizontal: 16,
              ),
              title: Text(
                m.name,
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
              ),
              subtitle: Text(
                m.description,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(color: Colors.white70),
              ),
              trailing: ConstrainedBox(
                constraints: const BoxConstraints.tightFor(
                  width: 120,
                  height: 48,
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      _formatPrice(m.priceCents),
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        color: Colors.white,
                      ),
                    ),
                    const SizedBox(height: 2),
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: Colors.white,
                        side: const BorderSide(color: Colors.white),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 0,
                        ),
                        textStyle: const TextStyle(fontSize: 12),
                        minimumSize: const Size(0, 26),
                        tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        visualDensity: const VisualDensity(
                          horizontal: -2,
                          vertical: -2,
                        ),
                      ),
                      onPressed: () => _handleAdd(m),
                      icon: const Icon(Icons.add, size: 14),
                      label: const Text(
                        'Toevoegen',
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class PaymentOption {
  final String id;
  final String title;
  final String description;
  final IconData icon;

  const PaymentOption({
    required this.id,
    required this.title,
    required this.description,
    required this.icon,
  });
}

const _paymentOptions = [
  PaymentOption(
    id: 'ideal',
    title: 'iDEAL',
    description: 'Betaal direct via je bankapp.',
    icon: Icons.account_balance,
  ),
  PaymentOption(
    id: 'creditcard',
    title: 'Creditcard',
    description: 'Visa of Mastercard betaling.',
    icon: Icons.credit_card,
  ),
  PaymentOption(
    id: 'test-pay-later',
    title: 'Betaal later (test)',
    description: 'Simuleert een geslaagde betaling.',
    icon: Icons.schedule,
  ),
];

class PaymentMethodPage extends StatefulWidget {
  final List<CartItem> items;
  final int totalCents;
  final String? authToken;
  final String? email;

  const PaymentMethodPage({
    super.key,
    required this.items,
    required this.totalCents,
    required this.authToken,
    required this.email,
  });

  @override
  State<PaymentMethodPage> createState() => _PaymentMethodPageState();
}

class _PaymentMethodPageState extends State<PaymentMethodPage> {
  PaymentOption? _selected;
  bool _loading = false;
  bool _checking = false;
  String? _paymentId;
  String? _checkoutUrl;
  String? _status;
  String? _error;
  String? authToken;
  Timer? _pollTimer;

  @override
  void initState() {
    super.initState();
    authToken = widget.authToken;
  }

  List<Map<String, dynamic>> get _itemPayload => widget.items
      .map((ci) => {'id': ci.item.id, 'qty': ci.qty})
      .toList(growable: false);

  @override
  void dispose() {
    _pollTimer?.cancel();
    super.dispose();
  }

  void _startPolling() {
    _pollTimer?.cancel();
    _pollTimer = Timer.periodic(
      const Duration(seconds: 2),
      (_) => _checkStatus(fromPoll: true),
    );
  }

  void _stopPolling() {
    _pollTimer?.cancel();
    _pollTimer = null;
  }

  Future<void> _startPayment(PaymentOption option) async {
    if (_loading) return;
    _stopPolling();
    setState(() {
      _selected = option;
      _loading = true;
      _error = null;
      _paymentId = null;
      _checkoutUrl = null;
      _status = null;
    });

    Map<String, dynamic>? orderResponse;
    try {
      final headers = <String, String>{'Content-Type': 'application/json'};
      final body = <String, dynamic>{
        'items': _itemPayload,
        if (option.id.toLowerCase() == 'ideal') 'method': option.id,
        if (widget.email != null) 'email': widget.email,
      };
      debugPrint(
        'HAPKE PAYMENT ➜ POST $apiBase/payments/create body=${jsonEncode(body)}',
      );
      final res = await apiClient.post(
        Uri.parse('$apiBase/payments/create'),
        headers: headers,
        body: jsonEncode(body),
      );
      debugPrint('HAPKE PAYMENT ➜ status=${res.statusCode} body=${res.body}');
      if (res.statusCode == 401) {
        return;
      }
      if (res.statusCode != 200 && res.statusCode != 201) {
        throw Exception('Server antwoordt ${res.statusCode}: ${res.body}');
      }
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final status = (data['status'] ?? '').toString();
      final statusLower = status.toLowerCase();
      final paymentId = (data['paymentId'] ?? '').toString();
      final checkoutUrl =
          (data['checkoutUrl'] is String &&
              (data['checkoutUrl'] as String).isNotEmpty)
          ? data['checkoutUrl'] as String
          : null;

      if (statusLower == 'paid' && paymentId.isNotEmpty) {
        _stopPolling();
        orderResponse = await _completeOrder(paymentId);
      } else {
        if (mounted) {
          setState(() {
            _paymentId = paymentId.isEmpty ? null : paymentId;
            _checkoutUrl = checkoutUrl;
            _status = status.isEmpty ? null : status;
          });
        }
        if (paymentId.isNotEmpty) {
          _startPolling();
        }
        if (checkoutUrl != null) {
          await _openCheckout();
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Betaling starten mislukt: $e';
        });
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }

    if (orderResponse != null && mounted) {
      Navigator.of(context).pop(orderResponse);
    }
  }

  Future<void> _checkStatus({bool fromPoll = false}) async {
    final paymentId = _paymentId;
    if (paymentId == null || _checking) return;
    if (mounted) {
      setState(() {
        _checking = true;
        if (!fromPoll) {
          _error = null;
        }
      });
    }
    Map<String, dynamic>? orderResponse;
    try {
      final res = await apiClient.get(
        Uri.parse('$apiBase/payments/$paymentId'),
      );
      debugPrint('HAPKE PAYMENT STATUS ➜ ${res.statusCode} ${res.body}');
      if (res.statusCode == 401) {
        return;
      }
      if (res.statusCode != 200) {
        throw Exception('Status ${res.statusCode}: ${res.body}');
      }
      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final status = (data['status'] ?? '').toString();
      final normalized = status.toLowerCase();
      if (normalized == 'paid') {
        _stopPolling();
        orderResponse = await _completeOrder(paymentId);
      } else if (normalized == 'failed' ||
          normalized == 'expired' ||
          normalized == 'canceled') {
        _stopPolling();
        if (mounted) {
          setState(() {
            _status = status;
            _error = 'Betaling $normalized';
          });
        }
      } else {
        if (mounted) {
          setState(() {
            _status = status;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Status controleren mislukt: $e';
        });
      }
      if (fromPoll) {
        _stopPolling();
      }
    } finally {
      if (mounted) {
        setState(() {
          _checking = false;
        });
      }
    }
    if (orderResponse != null && mounted) {
      Navigator.of(context).pop(orderResponse);
    }
  }

  Future<Map<String, dynamic>?> _completeOrder(String paymentId) async {
    _stopPolling();
    final token = widget.authToken ?? authToken ?? '';
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
    final body = <String, dynamic>{
      'items': _itemPayload,
      'paymentId': paymentId,
      if (widget.email != null) 'email': widget.email,
    };
    debugPrint('HAPKE ORDER ➜ POST $apiBase/orders body=${jsonEncode(body)}');
    try {
      if (token.isNotEmpty) {
        authToken = token;
      }
      apiClient.setToken(token);
      final res = await apiClient.post(
        Uri.parse('$apiBase/orders'),
        headers: headers,
        body: jsonEncode(body),
      );
      debugPrint('HAPKE ORDER ➜ status=${res.statusCode} body=${res.body}');
      if (res.statusCode == 401) {
        return null;
      }
      if (res.statusCode == 200 || res.statusCode == 201) {
        return jsonDecode(res.body) as Map<String, dynamic>;
      }
      if (mounted) {
        setState(() {
          _error =
              'Bestelling plaatsen mislukt: ${res.statusCode} • ${res.body}';
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = 'Bestelling plaatsen mislukt: $e';
        });
      }
    }
    return null;
  }

  Future<void> _openCheckout() async {
    final url = _checkoutUrl;
    if (url == null) return;
    final uri = Uri.tryParse(url);
    if (uri == null) {
      if (mounted) {
        setState(() {
          _error = 'Onbekende checkout link';
        });
      }
      return;
    }
    var launched = await launchUrl(uri, mode: LaunchMode.inAppBrowserView);
    if (!launched) {
      launched = await launchUrl(uri, mode: LaunchMode.externalApplication);
    }
    if (!launched && mounted) {
      setState(() {
        _error = 'Betaalpagina openen mislukt';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final total = _formatPrice(widget.totalCents);
    return Scaffold(
      appBar: AppBar(title: const Text('Kies betaalmethode')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Totaal te betalen',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            Text(
              total,
              style: Theme.of(
                context,
              ).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            ..._paymentOptions.map(_buildOption),
            if (_error != null)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text(
                  _error!,
                  style: const TextStyle(color: Colors.redAccent),
                ),
              ),
            if (_loading)
              const Padding(
                padding: EdgeInsets.only(top: 20),
                child: Center(child: CircularProgressIndicator()),
              ),
            if (_paymentId != null) _buildStatusCard(),
          ],
        ),
      ),
    );
  }

  Widget _buildOption(PaymentOption option) {
    final isSelected = _selected?.id == option.id;
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ListTile(
        leading: Icon(
          option.icon,
          color: isSelected
              ? Theme.of(context).colorScheme.primary
              : Colors.black54,
        ),
        title: Text(option.title),
        subtitle: Text(option.description),
        trailing: Icon(
          Icons.chevron_right,
          color: isSelected
              ? Theme.of(context).colorScheme.primary
              : Colors.black38,
        ),
        onTap: _loading ? null : () => _startPayment(option),
      ),
    );
  }

  Widget _buildStatusCard() {
    final status = (_status ?? 'onbekend').toUpperCase();
    return Card(
      margin: const EdgeInsets.only(top: 20),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Betaling gestart',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text('ID: $_paymentId'),
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(
                  Icons.info_outline,
                  size: 18,
                  color: Colors.blueGrey,
                ),
                const SizedBox(width: 8),
                Text('Status: $status'),
              ],
            ),
            const SizedBox(height: 12),
            if (_checkoutUrl != null)
              ElevatedButton.icon(
                onPressed: _openCheckout,
                icon: const Icon(Icons.open_in_new),
                label: const Text('Open betaalpagina'),
              ),
            ElevatedButton.icon(
              onPressed: _checking ? null : () => _checkStatus(),
              icon: _checking
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.refresh),
              label: Text(_checking ? 'Controleren...' : 'Status controleren'),
            ),
            const SizedBox(height: 8),
            const Text(
              'We controleren elke 2 seconden automatisch tot Mollie klaar is. '
              'Na een geslaagde betaling plaatsen we direct je bestelling.',
              style: TextStyle(fontSize: 12, color: Colors.black54),
            ),
          ],
        ),
      ),
    );
  }
}

class OrderConfirmationPage extends StatelessWidget {
  final OrderSummary summary;
  final Future<void> Function()? onTrack;

  const OrderConfirmationPage({super.key, required this.summary, this.onTrack});

  String get _formattedDate {
    final dt = summary.createdAt;
    final day = dt.day.toString().padLeft(2, '0');
    final month = dt.month.toString().padLeft(2, '0');
    final year = dt.year.toString();
    final hour = dt.hour.toString().padLeft(2, '0');
    final minute = dt.minute.toString().padLeft(2, '0');
    return '$day-$month-$year $hour:$minute';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Scaffold(
      appBar: AppBar(title: const Text('Bestelling bevestigd')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Ordernummer', style: theme.textTheme.labelMedium),
            Text(
              summary.orderId,
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Text('Datum', style: theme.textTheme.labelMedium),
            Text(_formattedDate, style: theme.textTheme.bodyLarge),
            const SizedBox(height: 16),
            Text('Overzicht', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            Expanded(
              child: Card(
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemBuilder: (context, index) {
                    final item = summary.items[index];
                    return Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.name,
                                style: theme.textTheme.titleMedium,
                              ),
                              Text(
                                'x${item.qty}',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          _formatEuros(item.lineTotal),
                          style: theme.textTheme.titleMedium,
                        ),
                      ],
                    );
                  },
                  separatorBuilder: (_, __) => const Divider(),
                  itemCount: summary.items.length,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Totaal',
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  _formatEuros(summary.total),
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: onTrack == null
                  ? null
                  : () async {
                      await onTrack!();
                    },
              child: const Text('Bestelling volgen'),
            ),
          ],
        ),
      ),
    );
  }
}

class OrderTrackingPage extends StatefulWidget {
  final String orderId;
  final String? authToken;
  final String? initialStatus;
  final int? initialEtaMinutes;
  final List<OrderStatusStepInfo> initialSteps;
  final Future<void> Function()? onDelivered;
  final Future<void> Function()? onOrderMissing;
  final VoidCallback? onConnectionError;

  const OrderTrackingPage({
    super.key,
    required this.orderId,
    required this.authToken,
    this.initialStatus,
    this.initialEtaMinutes,
    this.initialSteps = const [],
    this.onDelivered,
    this.onOrderMissing,
    this.onConnectionError,
  });

  @override
  State<OrderTrackingPage> createState() => _OrderTrackingPageState();
}

class _OrderTrackingPageState extends State<OrderTrackingPage> {
  bool _loading = true;
  String? _status;
  int? _etaMinutes;
  String? _error;
  List<OrderStatusStepInfo> _steps = const [];
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    if (widget.initialStatus != null) {
      _status = widget.initialStatus;
      _etaMinutes = widget.initialEtaMinutes;
      _steps = widget.initialSteps;
      _loading = false;
    }
    _fetchStatus(initial: true);
  }

  @override
  void dispose() {
    _stopPolling();
    super.dispose();
  }

  void _startPolling() {
    _timer ??= Timer.periodic(
      const Duration(seconds: 10),
      (_) => _fetchStatus(),
    );
  }

  void _stopPolling() {
    _timer?.cancel();
    _timer = null;
  }

  Future<void> _fetchStatus({bool initial = false}) async {
    final token = widget.authToken;
    if (token == null || token.isEmpty) {
      setState(() {
        _error = 'Log in om je bestelling te volgen.';
        _loading = false;
      });
      return;
    }

    if (initial) {
      setState(() {
        _error = null;
        _loading = _status == null;
      });
    } else {
      setState(() => _error = null);
    }

    try {
      final res = await apiClient.get(
        Uri.parse('$apiBase/orders/${widget.orderId}/status'),
      );

      if (res.statusCode == 404) {
        await widget.onOrderMissing?.call();
        if (!mounted) return;
        Navigator.of(context).maybePop();
        return;
      }

      if (res.statusCode == 401) {
        return;
      }

      if (res.statusCode != 200) {
        throw Exception('Status ${res.statusCode}');
      }

      final data = jsonDecode(res.body) as Map<String, dynamic>;
      final status = (data['status'] ?? '').toString();
      final eta = data['etaMinutes'] is num
          ? (data['etaMinutes'] as num).round()
          : int.tryParse('${data['etaMinutes']}');
      final stepsJson = (data['steps'] as List<dynamic>? ?? const [])
          .whereType<Map<String, dynamic>>()
          .map(
            (step) => OrderStatusStepInfo(
              name: (step['name'] ?? '').toString(),
              at: DateTime.tryParse(step['at']?.toString() ?? ''),
            ),
          )
          .toList();

      if (!mounted) return;
      setState(() {
        _loading = false;
        _status = status;
        _etaMinutes = eta;
        _steps = stepsJson;
        _error = null;
      });

      if (status == 'DELIVERED') {
        _stopPolling();
        await widget.onDelivered?.call();
      } else {
        _startPolling();
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _error = 'Geen verbinding. Probeer opnieuw';
      });
      widget.onConnectionError?.call();
      _stopPolling();
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final status = _status ?? 'RECEIVED';
    final etaText = status == 'DELIVERED'
        ? 'Bezorgd'
        : _etaMinutes != null
        ? 'ETA: ~${_etaMinutes!} min'
        : 'ETA onbekend';

    return Scaffold(
      appBar: AppBar(title: const Text('Bestelling volgen')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Ordernummer', style: theme.textTheme.labelMedium),
                  Text(
                    widget.orderId,
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    etaText,
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: status == 'DELIVERED'
                          ? Colors.green
                          : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 16),
                  Expanded(
                    child: Card(
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          vertical: 16,
                          horizontal: 12,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            _buildStep(
                              context,
                              title: 'Order ontvangen',
                              timestamp: _timestampFor('RECEIVED'),
                              isCompleted: _statusReached('RECEIVED'),
                              isActive: status == 'RECEIVED',
                            ),
                            _buildDivider(),
                            _buildStep(
                              context,
                              title: 'Order wordt gemaakt',
                              timestamp: _timestampFor('PREPARING'),
                              isCompleted: _statusReached('PREPARING'),
                              isActive: status == 'PREPARING',
                            ),
                            _buildDivider(),
                            _buildStep(
                              context,
                              title: status == 'DELIVERED'
                                  ? 'Bezorgd'
                                  : 'Onderweg',
                              timestamp: status == 'DELIVERED'
                                  ? _timestampFor('DELIVERED')
                                  : _timestampFor('ON_THE_WAY'),
                              isCompleted: status == 'DELIVERED',
                              isActive: status == 'ON_THE_WAY',
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  if (_error != null) ...[
                    const SizedBox(height: 12),
                    Text(
                      _error!,
                      style: const TextStyle(color: Colors.redAccent),
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton(
                      onPressed: () => _fetchStatus(),
                      child: const Text('Opnieuw proberen'),
                    ),
                  ],
                ],
              ),
      ),
    );
  }

  Widget _buildDivider() {
    return Padding(
      padding: const EdgeInsets.only(left: 15),
      child: Container(width: 2, height: 24, color: Colors.grey.shade300),
    );
  }

  Widget _buildStep(
    BuildContext context, {
    required String title,
    required DateTime? timestamp,
    required bool isCompleted,
    required bool isActive,
  }) {
    final theme = Theme.of(context);
    final icon = isCompleted
        ? Icons.check_circle
        : isActive
        ? Icons.radio_button_checked
        : Icons.radio_button_unchecked;
    final color = isCompleted
        ? Colors.green
        : isActive
        ? Colors.orange
        : Colors.grey;

    final timeText = timestamp != null
        ? '${timestamp.hour.toString().padLeft(2, '0')}:${timestamp.minute.toString().padLeft(2, '0')}'
        : null;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, color: color),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: theme.textTheme.titleMedium?.copyWith(color: color),
              ),
              if (timeText != null)
                Text(
                  'om $timeText',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }

  bool _statusReached(String target) {
    final current = _status;
    if (current == null) return false;
    const order = ['RECEIVED', 'PREPARING', 'ON_THE_WAY', 'DELIVERED'];
    final currentIndex = order.indexOf(current);
    final targetIndex = order.indexOf(target);
    if (currentIndex == -1 || targetIndex == -1) return false;
    return currentIndex >= targetIndex;
  }

  DateTime? _timestampFor(String name) {
    return _steps
        .firstWhere(
          (element) => element.name == name,
          orElse: () => const OrderStatusStepInfo(name: '', at: null),
        )
        .at;
  }
}

class CartPage extends StatelessWidget {
  final List<CartItem> items;
  final int totalCents;
  final void Function(CartItem, int) onUpdateQty;
  final VoidCallback onCheckout;
  final VoidCallback onClear;

  const CartPage({
    super.key,
    required this.items,
    required this.totalCents,
    required this.onUpdateQty,
    required this.onCheckout,
    required this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    final groupedByRestaurant = <String, List<CartItem>>{};
    for (final ci in items) {
      groupedByRestaurant.putIfAbsent(ci.restaurant.name, () => []).add(ci);
    }

    // Subtotaal van alle items
    final int subtotalCents = items.fold(
      0,
      (s, ci) => s + ci.item.priceCents * ci.qty,
    );

    // Base bezorgkosten per restaurant + extra toeslag €1 als onder minimum
    int baseDeliveryCents = 0;
    int extraSurchargeCents = 0;
    final List<Widget> deliveryRows = [];
    final List<Widget> surchargeRows = [];

    groupedByRestaurant.forEach((restName, cartList) {
      if (cartList.isEmpty) return;
      final rest = cartList.first.restaurant;
      // Som per restaurant
      final sumCents = cartList.fold(
        0,
        (s, ci) => s + ci.item.priceCents * ci.qty,
      );
      // Bezorgkosten (basis)
      final fee = rest.deliveryFee;
      if (fee != null && fee > 0) {
        final cents = (fee * 100).round();
        baseDeliveryCents += cents;
        deliveryRows.add(
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Text(
                  'Bezorgkosten (${rest.name})',
                  style: const TextStyle(fontSize: 13),
                ),
              ),
              Text(_formatPrice(cents)),
            ],
          ),
        );
      }
      // Extra toeslag indien onder minimum
      final minOrder = rest.minOrder;
      final minCents = (minOrder * 100).round();
      if (minCents > 0 && sumCents < minCents) {
        extraSurchargeCents += 100; // €1,00
        surchargeRows.add(
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Flexible(
                child: Text(
                  'Extra bezorgkosten (onder min • ${rest.name})',
                  style: const TextStyle(fontSize: 13),
                ),
              ),
              Text(_formatPrice(100)),
            ],
          ),
        );
      }
    });

    return Scaffold(
      appBar: AppBar(title: const Text('MANDDD!!')),
      body: items.isEmpty
          ? const Center(child: Text('MANDDD!! is leeg'))
          : ListView(
              padding: const EdgeInsets.all(12),
              children: [
                for (final entry in groupedByRestaurant.entries) ...[
                  Text(
                    entry.key,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  ...entry.value.map(
                    (ci) => Card(
                      child: ListTile(
                        title: Text(ci.item.name),
                        subtitle: Text(_formatPrice(ci.item.priceCents)),
                        trailing: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            IconButton(
                              onPressed: () => onUpdateQty(ci, (ci.qty - 1)),
                              icon: const Icon(Icons.remove_circle_outline),
                            ),
                            Text('${ci.qty}'),
                            IconButton(
                              onPressed: () => onUpdateQty(ci, (ci.qty + 1)),
                              icon: const Icon(Icons.add_circle_outline),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                const Divider(),
                const SizedBox(height: 8),
                // Overzicht kosten
                Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Subtotaal'),
                        Text(_formatPrice(subtotalCents)),
                      ],
                    ),
                    const SizedBox(height: 6),
                    ...deliveryRows,
                    if (deliveryRows.isNotEmpty) const SizedBox(height: 6),
                    ...surchargeRows,
                    if (surchargeRows.isNotEmpty) const SizedBox(height: 6),
                    const Divider(),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Totaal',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        Text(
                          _formatPrice(
                            subtotalCents +
                                baseDeliveryCents +
                                extraSurchargeCents,
                          ),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                    if (surchargeRows.isNotEmpty)
                      const Padding(
                        padding: EdgeInsets.only(top: 6),
                        child: Text(
                          'Let op: je zit onder het minimum bij één of meer restaurants. Je kunt nu toch bestellen, er wordt €1 extra bezorgkosten per restaurant gerekend.',
                          style: TextStyle(fontSize: 12, color: Colors.black54),
                        ),
                      ),
                  ],
                ),
                const SizedBox(height: 12),
                ElevatedButton.icon(
                  onPressed: onCheckout,
                  icon: const Icon(Icons.payment),
                  label: const Text('Afrekenen'),
                ),
                TextButton(
                  onPressed: onClear,
                  child: const Text('MANDDD!! leegmaken'),
                ),
              ],
            ),
    );
  }
}

/// ---------------- Login ----------------
class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();
  String? _gender; // Man, Vrouw, Anders, Zeg ik liever niet
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passwordCtrl.dispose();
    _phoneCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    final email = _emailCtrl.text.trim();
    final password = _passwordCtrl.text;

    setState(() {
      _loading = true;
      _error = null;
    });

    Future<AuthSession?> tryAuthenticate() async {
      final headers = {'Content-Type': 'application/json'};
      final registerBody = jsonEncode({'email': email, 'password': password});

      http.Response res;
      try {
        res = await apiClient.post(
          Uri.parse('$apiBase/auth/register'),
          headers: headers,
          body: registerBody,
        );
      } catch (e) {
        _error = 'Kan server niet bereiken: $e';
        return null;
      }

      // Treat 200 or 201 as success for register
      if (res.statusCode == 200 || res.statusCode == 201) {
        final sessionFromRegister = _parseAuthResponse(res.body);
        // If register doesn't return a token, immediately log in
        if (sessionFromRegister.token.isEmpty) {
          try {
            final loginRes = await apiClient.post(
              Uri.parse('$apiBase/auth/login'),
              headers: headers,
              body: registerBody,
            );
            if (loginRes.statusCode == 200) {
              return _parseAuthResponse(loginRes.body);
            } else {
              _error =
                  'Inloggen na registreren mislukt (${loginRes.statusCode})';
              return null;
            }
          } catch (e) {
            _error = 'Inloggen na registreren mislukt: $e';
            return null;
          }
        }
        return sessionFromRegister;
      }

      // If already exists or bad request, try login directly
      if (res.statusCode == 400 || res.statusCode == 409) {
        try {
          final loginRes = await apiClient.post(
            Uri.parse('$apiBase/auth/login'),
            headers: headers,
            body: registerBody,
          );
          if (loginRes.statusCode == 200) {
            return _parseAuthResponse(loginRes.body);
          }
          _error = 'Inloggen mislukt (${loginRes.statusCode})';
        } catch (e) {
          _error = 'Inloggen mislukt: $e';
        }
        return null;
      }

      _error = 'Registreren mislukt (${res.statusCode})';
      return null;
    }

    final session = await tryAuthenticate();
    if (!mounted) return;

    if (session != null) {
      if (session.token.isEmpty) {
        setState(() => _loading = false);
        const msg = 'Geen toegangstoken ontvangen van de server';
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text(msg)));
        return;
      }
      Navigator.of(context).pop(session);
    } else {
      setState(() => _loading = false);
      if (_error != null) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(_error!)));
      }
    }
  }

  AuthSession _parseAuthResponse(String body) {
    final data = jsonDecode(body) as Map<String, dynamic>;
    final userData = data['user'] as Map<String, dynamic>? ?? const {};
    final tokenValue =
        data['access_token'] ?? data['accessToken'] ?? data['token'] ?? '';
    final token = tokenValue.toString();

    final user = HapkeUser(
      name: _nameCtrl.text.trim().isNotEmpty
          ? _nameCtrl.text.trim()
          : (userData['name'] ?? '') as String? ?? '',
      email: (userData['email'] ?? _emailCtrl.text.trim()).toString(),
      phone: _phoneCtrl.text.trim(),
      address: _addressCtrl.text.trim(),
      gender: _gender ?? 'Zeg ik liever niet',
    );

    return AuthSession(user: user, token: token);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Inloggen / Aanmelden')),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            TextFormField(
              controller: _nameCtrl,
              decoration: const InputDecoration(
                labelText: 'Naam',
                border: OutlineInputBorder(),
              ),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Vul je naam in' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _emailCtrl,
              decoration: const InputDecoration(
                labelText: 'E‑mail',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.emailAddress,
              validator: (v) {
                final value = v?.trim() ?? '';
                final emailOk = RegExp(r'^.+@.+\..+$').hasMatch(value);
                return emailOk ? null : 'Vul een geldig e‑mailadres in';
              },
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _passwordCtrl,
              decoration: const InputDecoration(
                labelText: 'Wachtwoord (minimaal 6 tekens)',
                border: OutlineInputBorder(),
              ),
              obscureText: true,
              validator: (v) => (v == null || v.trim().length < 6)
                  ? 'Vul een wachtwoord in'
                  : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phoneCtrl,
              decoration: const InputDecoration(
                labelText: 'Mobiel nummer',
                border: OutlineInputBorder(),
              ),
              keyboardType: TextInputType.phone,
              validator: (v) => (v == null || v.trim().length < 6)
                  ? 'Vul een geldig nummer in'
                  : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _addressCtrl,
              decoration: const InputDecoration(
                labelText: 'Adres',
                border: OutlineInputBorder(),
              ),
              validator: (v) =>
                  (v == null || v.trim().isEmpty) ? 'Vul je adres in' : null,
            ),
            const SizedBox(height: 12),
            DropdownButtonFormField<String>(
              value: _gender,
              items: const [
                DropdownMenuItem(value: 'Man', child: Text('Man')),
                DropdownMenuItem(value: 'Vrouw', child: Text('Vrouw')),
                DropdownMenuItem(value: 'Anders', child: Text('Anders')),
                DropdownMenuItem(
                  value: 'Zeg ik liever niet',
                  child: Text('Zeg ik liever niet'),
                ),
              ],
              onChanged: (v) => setState(() => _gender = v),
              decoration: const InputDecoration(
                labelText: 'Geslacht',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 20),
            ElevatedButton.icon(
              onPressed: _loading ? null : _submit,
              icon: _loading
                  ? const SizedBox(
                      height: 18,
                      width: 18,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Icon(Icons.login),
              label: const Text('Aanmelden'),
            ),
          ],
        ),
      ),
    );
  }
}

/// ---------------- Widgets & helpers ----------------
class _HapkeDrawer extends StatelessWidget {
  final HapkeUser? user;
  final int cartCount;
  final VoidCallback onOpenCart;
  final VoidCallback onLoginTap;
  final Future<void> Function() onLogoutTap;

  const _HapkeDrawer({
    required this.user,
    required this.cartCount,
    required this.onOpenCart,
    required this.onLoginTap,
    required this.onLogoutTap,
  });

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            UserAccountsDrawerHeader(
              accountName: Text(user?.name ?? 'Niet ingelogd'),
              accountEmail: Text(user?.email ?? 'Log in om te bestellen'),
              currentAccountPicture: CircleAvatar(
                backgroundColor: Colors.white,
                child: Text(
                  (user?.name.isNotEmpty ?? false)
                      ? user!.name[0].toUpperCase()
                      : 'H',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    color: Colors.red,
                  ),
                ),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.shopping_bag_outlined),
              title: Text('MANDDD!! (${cartCount})'),
              onTap: () {
                Navigator.pop(context);
                onOpenCart();
              },
            ),
            if (user == null)
              ListTile(
                leading: const Icon(Icons.login),
                title: const Text('Inloggen / Aanmelden'),
                onTap: () {
                  Navigator.pop(context);
                  onLoginTap();
                },
              )
            else ...[
              ListTile(
                leading: const Icon(Icons.person),
                title: const Text('Profiel'),
                subtitle: Text(
                  '${user!.name} • ${user!.phone}\n${user!.address}',
                ),
                isThreeLine: true,
              ),
              ListTile(
                leading: const Icon(Icons.logout),
                title: const Text('Uitloggen'),
                onTap: () async {
                  Navigator.pop(context);
                  await onLogoutTap();
                },
              ),
            ],
            const Spacer(),
            const Padding(
              padding: EdgeInsets.all(12),
              child: Text(
                'Hapke • demo build',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CategoryChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onSelected;
  final String? iconUrl; // kleine afbeelding (niet de restaurantfoto)

  const _CategoryChip({
    required this.label,
    required this.selected,
    required this.onSelected,
    this.iconUrl,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8),
      child: ChoiceChip(
        labelPadding: const EdgeInsets.symmetric(horizontal: 10),
        avatar: iconUrl == null
            ? const CircleAvatar(
                radius: 10,
                backgroundColor: Colors.white24,
                child: Icon(Icons.fastfood, size: 14, color: Colors.white),
              )
            : CircleAvatar(
                radius: 10,
                backgroundColor: Colors.white,
                child: ClipOval(
                  child: Image.network(
                    iconUrl!,
                    width: 18,
                    height: 18,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => const Icon(
                      Icons.fastfood,
                      size: 14,
                      color: Colors.black54,
                    ),
                  ),
                ),
              ),
        label: Text(
          label,
          style: TextStyle(
            color: Colors.white,
            fontWeight: selected ? FontWeight.w700 : FontWeight.w600,
          ),
        ),
        selected: selected,
        showCheckmark: false,
        backgroundColor: const Color(0xFF0A2342), // navy blue
        selectedColor: const Color(0xFF0A2342),
        side: BorderSide(color: selected ? Colors.white : Colors.white24),
        onSelected: (_) => onSelected(),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }
}

String _formatPrice(int cents) {
  final euros = cents / 100.0;
  return '€ ${euros.toStringAsFixed(2)}';
}

String _formatEuros(double euros) => '€ ' + euros.toStringAsFixed(2);

class _Badge extends StatelessWidget {
  final int? count;
  const _Badge({required this.count});

  @override
  Widget build(BuildContext context) {
    final c = count ?? 0;
    if (c <= 0) return const SizedBox.shrink();
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 2),
      decoration: BoxDecoration(
        color: Colors.red,
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        c.toString(),
        style: const TextStyle(fontSize: 11, color: Colors.white),
      ),
    );
  }
}

class StickyCartBar extends StatelessWidget {
  final int totalCents;
  final int itemCount;
  final VoidCallback onTap;
  const StickyCartBar({
    super.key,
    required this.totalCents,
    required this.itemCount,
    required this.onTap,
  });
  @override
  Widget build(BuildContext context) {
    return SafeArea(
      top: false,
      child: InkWell(
        onTap: onTap,
        child: Container(
          margin: const EdgeInsets.all(12),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFF0A2342),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.white12),
            boxShadow: const [
              BoxShadow(
                color: Colors.black26,
                blurRadius: 12,
                offset: Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              const Icon(Icons.shopping_bag, color: Colors.white),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'MANDDD!! ($itemCount)',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Text(
                _formatPrice(totalCents),
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _SearchPill extends StatelessWidget {
  final ValueChanged<String> onChanged;
  const _SearchPill({required this.onChanged});
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 40,
      decoration: BoxDecoration(
        color: Colors.grey.shade200,
        borderRadius: BorderRadius.circular(20),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12),
      alignment: Alignment.centerLeft,
      child: Row(
        children: [
          const Icon(Icons.search),
          const SizedBox(width: 8),
          Expanded(
            child: TextField(
              decoration: const InputDecoration(
                hintText: 'Zoek gerechten, keukens...',
                border: InputBorder.none,
              ),
              onChanged: onChanged,
            ),
          ),
        ],
      ),
    );
  }
}

class VideosTab extends StatefulWidget {
  final List<Restaurant> restaurants;
  final void Function(Restaurant, MenuItem) onAdd;
  final List<CartItem> cartItems;
  final Future<void> Function(BuildContext) openCartModal;
  const VideosTab({
    super.key,
    required this.restaurants,
    required this.onAdd,
    required this.cartItems,
    required this.openCartModal,
  });

  @override
  State<VideosTab> createState() => _VideosTabState();
}

class _VideosTabState extends State<VideosTab> {
  // onthoud welke menu-items geliked zijn en welke comments er zijn
  final Set<String> _liked = <String>{};
  final Map<String, List<String>> _comments = <String, List<String>>{};

  void _toggleLike(MenuItem? item) {
    if (item == null) return;
    setState(() {
      if (_liked.contains(item.id)) {
        _liked.remove(item.id);
      } else {
        _liked.add(item.id);
      }
    });
  }

  Future<void> _addComment(BuildContext context, MenuItem? item) async {
    if (item == null) return;
    final controller = TextEditingController();
    await showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(ctx).viewInsets.bottom + 12,
            left: 16,
            right: 16,
            top: 16,
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(
                'Reageer op ${item.name}',
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 12),
              TextField(
                controller: controller,
                maxLines: 3,
                decoration: const InputDecoration(
                  hintText: 'Schrijf je comment...',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton.icon(
                onPressed: () {
                  final text = controller.text.trim();
                  if (text.isNotEmpty) {
                    setState(() {
                      _comments
                          .putIfAbsent(item.id, () => <String>[])
                          .add(text);
                    });
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Comment geplaatst')),
                    );
                  }
                },
                icon: const Icon(Icons.send),
                label: const Text('Opslaan'),
              ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
    // Do not dispose controller here.
  }

  Future<void> _sendToFriend(
    BuildContext context,
    Restaurant r,
    MenuItem? m,
  ) async {
    if (m == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Geen gerecht geselecteerd')),
      );
      return;
    }
    String? selected;
    await showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (ctx) {
        return SafeArea(
          top: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Padding(
                padding: EdgeInsets.all(16),
                child: Text(
                  'Stuur naar vriend',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700),
                ),
              ),
              for (final f in AppInbox.friends)
                RadioListTile<String>(
                  title: Text(f),
                  value: f,
                  groupValue: selected,
                  onChanged: (v) {
                    selected = v;
                    Navigator.pop(ctx);
                  },
                ),
              const SizedBox(height: 8),
            ],
          ),
        );
      },
    );
    if (selected != null) {
      final text =
          'Deel: ${r.name} • ${m.name} • ${_formatPrice(m.priceCents)}';
      AppInbox.sendToFriend(selected!, text);
      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('Verstuurd naar $selected')));
        setState(() {});
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final restaurants = widget.restaurants;
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF0A2342),
        clipBehavior: Clip.none,
        title: Transform.scale(
          scale: 1.4,
          child: SizedBox(
            height: kToolbarHeight,
            child: Image.asset(
              'assets/icons/hapke_logo.png',
              fit: BoxFit.contain,
              errorBuilder: (_, __, ___) => const Center(
                child: Text(
                  'Hapke',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
            ),
          ),
        ),
        centerTitle: true,
      ),
      body: PageView.builder(
        scrollDirection: Axis.vertical,
        itemCount: restaurants.length,
        itemBuilder: (context, rIndex) {
          final r = restaurants[rIndex];

          // voor elke restaurantpagina houden we het huidige gerecht bij
          final ValueNotifier<MenuItem?> selectedItem =
              ValueNotifier<MenuItem?>(r.menu.isNotEmpty ? r.menu.first : null);

          return Stack(
            fit: StackFit.expand,
            children: [
              ValueListenableBuilder<MenuItem?>(
                valueListenable: selectedItem,
                builder: (context, current, _) {
                  // primaire gerechtfoto (als beschikbaar), anders restaurantfoto
                  final primary = current == null
                      ? r.imageUrl
                      : (_dishImages[current.id] ?? r.imageUrl);

                  // probeer eerst de gerechtfoto; als die faalt, val terug op restaurantfoto
                  return Image.network(
                    primary,
                    fit: BoxFit.cover,
                    errorBuilder: (_, __, ___) => Image.network(
                      r.imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => const ColoredBox(
                        color: Colors.black12,
                        child: Center(child: Icon(Icons.fastfood, size: 48)),
                      ),
                    ),
                  );
                },
              ),
              Positioned.fill(
                child: Container(color: Colors.black.withOpacity(0.35)),
              ),

              // VOORGROND: TEKST OVER DE FOTO
              SafeArea(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Boven: restaurantinfo
                      Text(
                        r.name,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 26,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        r.cuisine,
                        style: const TextStyle(color: Colors.white70),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.star, color: Colors.amber, size: 18),
                          const SizedBox(width: 4),
                          Text(
                            r.rating.toStringAsFixed(1),
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          const SizedBox(width: 12),
                          const Icon(
                            Icons.timer,
                            color: Colors.white,
                            size: 18,
                          ),
                          const SizedBox(width: 4),
                          Text(
                            r.eta,
                            style: const TextStyle(color: Colors.white),
                          ),
                        ],
                      ),

                      const Spacer(),

                      // Onder: geselecteerd gerecht
                      ValueListenableBuilder<MenuItem?>(
                        valueListenable: selectedItem,
                        builder: (context, m, _) {
                          if (m == null) {
                            return const Text(
                              'Geen menu-items beschikbaar',
                              style: TextStyle(color: Colors.white70),
                            );
                          }
                          return Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                m.name,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 22,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Text(
                                m.description,
                                style: const TextStyle(color: Colors.white70),
                              ),
                              const SizedBox(height: 8),
                              Text(
                                _formatPrice(m.priceCents),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.w800,
                                ),
                              ),
                              const SizedBox(height: 12),
                              Row(
                                children: [
                                  Expanded(
                                    child: ElevatedButton.icon(
                                      onPressed: () {
                                        final videosContext = context;
                                        Navigator.of(context).push(
                                          MaterialPageRoute(
                                            builder: (_) => RestaurantDetailPage(
                                              restaurant: r,
                                              cartItems: widget.cartItems,
                                              openCartModal:
                                                  widget.openCartModal,
                                              onAdd: (m) {
                                                widget.onAdd(r, m);
                                                if (mounted) {
                                                  ScaffoldMessenger.of(
                                                    videosContext,
                                                  ).showSnackBar(
                                                    SnackBar(
                                                      content: Text(
                                                        '${m.name} toegevoegd aan MANDDD!!',
                                                      ),
                                                      duration: const Duration(
                                                        milliseconds: 900,
                                                      ),
                                                    ),
                                                  );
                                                  setState(() {});
                                                }
                                              },
                                            ),
                                          ),
                                        );
                                      },
                                      icon: const Icon(
                                        Icons.shopping_bag_outlined,
                                      ),
                                      label: const Text('Restaurant'),
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: OutlinedButton.icon(
                                      style: OutlinedButton.styleFrom(
                                        side: const BorderSide(
                                          color: Colors.white,
                                        ),
                                        foregroundColor: Colors.white,
                                      ),
                                      onPressed: () {
                                        widget.onAdd(r, m);
                                        ScaffoldMessenger.of(
                                          context,
                                        ).showSnackBar(
                                          const SnackBar(
                                            content: Text(
                                              'Toegevoegd aan MANDDD!!',
                                            ),
                                            duration: Duration(
                                              milliseconds: 900,
                                            ),
                                          ),
                                        );
                                      },
                                      icon: const Icon(
                                        Icons.add,
                                        color: Colors.white,
                                      ),
                                      label: const Text(
                                        'Toevoegen',
                                        style: TextStyle(color: Colors.white),
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          );
                        },
                      ),
                    ],
                  ),
                ),
              ),

              // Onzichtbare horizontale pager om van gerecht te wisselen
              Align(
                alignment: Alignment.center,
                child: SizedBox(
                  height: MediaQuery.of(context).size.height * 0.65,
                  child: PageView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: r.menu.length,
                    onPageChanged: (mIndex) {
                      if (r.menu.isNotEmpty)
                        selectedItem.value = r.menu[mIndex];
                    },
                    itemBuilder: (_, __) => const SizedBox.shrink(),
                  ),
                ),
              ),

              // Rechter zij-actieknoppen (like, comment, versturen) voor HUIDIG gerecht
              Positioned(
                right: 16,
                bottom: 120,
                child: ValueListenableBuilder<MenuItem?>(
                  valueListenable: selectedItem,
                  builder: (context, currentM, _) {
                    final isLiked =
                        currentM != null && _liked.contains(currentM.id);
                    final commentCount = currentM == null
                        ? 0
                        : (_comments[currentM.id]?.length ?? 0);
                    return Column(
                      children: [
                        _RoundIconButton(
                          icon: isLiked
                              ? Icons.favorite
                              : Icons.favorite_border,
                          color: isLiked ? Colors.red : Colors.white70,
                          onTap: () => _toggleLike(currentM),
                        ),
                        const SizedBox(height: 12),
                        _RoundIconButton(
                          icon: Icons.chat_bubble_outline,
                          color: Colors.white70,
                          badgeCount: commentCount,
                          onTap: () => _addComment(context, currentM),
                        ),
                        const SizedBox(height: 12),
                        _RoundIconButton(
                          icon: Icons.send_outlined,
                          color: Colors.white70,
                          onTap: () => _sendToFriend(context, r, currentM),
                        ),
                      ],
                    );
                  },
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _RoundIconButton extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  final int? badgeCount;
  const _RoundIconButton({
    required this.icon,
    required this.color,
    required this.onTap,
    this.badgeCount,
  });
  @override
  Widget build(BuildContext context) {
    final hasBadge = (badgeCount ?? 0) > 0;
    return Stack(
      clipBehavior: Clip.none,
      children: [
        Material(
          color: color.withOpacity(0.85),
          shape: const CircleBorder(),
          child: InkWell(
            customBorder: const CircleBorder(),
            onTap: onTap,
            child: SizedBox(
              width: 48,
              height: 48,
              child: Icon(
                icon,
                color: icon == Icons.favorite ? Colors.white : Colors.black87,
              ),
            ),
          ),
        ),
        if (hasBadge)
          Positioned(
            right: -4,
            top: -4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.red,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.white, width: 1),
              ),
              child: Text(
                '${badgeCount ?? 0}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 11,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
      ],
    );
  }
}

class FriendsTab extends StatefulWidget {
  const FriendsTab({super.key});
  @override
  State<FriendsTab> createState() => _FriendsTabState();
}

class _FriendsTabState extends State<FriendsTab> {
  @override
  void initState() {
    super.initState();
    AppInbox.tick.addListener(_onInboxChanged);
  }

  void _onInboxChanged() {
    if (mounted) setState(() {});
  }

  @override
  void dispose() {
    AppInbox.tick.removeListener(_onInboxChanged);
    super.dispose();
  }

  Widget build(BuildContext context) {
    final friends = List<String>.from(AppInbox.friends)
      ..sort((a, b) {
        final lastA = AppInbox.getConversation(a).isNotEmpty
            ? AppInbox.getConversation(a).last
            : "";
        final lastB = AppInbox.getConversation(b).isNotEmpty
            ? AppInbox.getConversation(b).last
            : "";
        return lastB.compareTo(lastA);
      });
    return Scaffold(
      appBar: AppBar(title: const Text('Vrienden')),
      body: ListView.separated(
        padding: const EdgeInsets.all(12),
        itemCount: friends.length,
        separatorBuilder: (_, __) => const SizedBox(height: 8),
        itemBuilder: (_, i) {
          final name = friends[i];
          final last = AppInbox.getConversation(name).isNotEmpty
              ? AppInbox.getConversation(name).last
              : 'Nog geen berichten';
          final unread = AppInbox.getUnread(name);
          return Card(
            child: ListTile(
              leading: CircleAvatar(
                child: Text(name.substring(0, 1).toUpperCase()),
              ),
              title: Text(name, maxLines: 1, overflow: TextOverflow.ellipsis),
              subtitle: Text(
                last,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              trailing: unread > 0
                  ? CircleAvatar(
                      radius: 12,
                      backgroundColor: Colors.orange,
                      child: Text(
                        '$unread',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                        ),
                      ),
                    )
                  : null,
              onTap: () async {
                await Navigator.of(context).push(
                  MaterialPageRoute(builder: (_) => ChatPage(friend: name)),
                );
                setState(() {}); // refresh counters
              },
            ),
          );
        },
      ),
    );
  }
}

class ChatPage extends StatefulWidget {
  final String friend;
  const ChatPage({super.key, required this.friend});
  @override
  State<ChatPage> createState() => _ChatPageState();
}

class _ChatPageState extends State<ChatPage> {
  final _ctrl = TextEditingController();

  @override
  void initState() {
    super.initState();
    AppInbox.markRead(widget.friend);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final msgs = AppInbox.getConversation(widget.friend);
    return Scaffold(
      appBar: AppBar(title: Text(widget.friend)),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: msgs.length,
              itemBuilder: (_, i) => Align(
                alignment: Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  padding: const EdgeInsets.symmetric(
                    horizontal: 12,
                    vertical: 8,
                  ),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade200,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Text(msgs[i]),
                ),
              ),
            ),
          ),
          SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _ctrl,
                      decoration: const InputDecoration(
                        hintText: 'Schrijf een bericht...',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  ElevatedButton.icon(
                    onPressed: () {
                      final t = _ctrl.text.trim();
                      if (t.isEmpty) return;
                      AppInbox.sendToFriend(widget.friend, t);
                      _ctrl.clear();
                      setState(() {});
                    },
                    icon: const Icon(Icons.send),
                    label: const Text('Stuur'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
