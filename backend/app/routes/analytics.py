from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException, Query
from ..mock_store import get_section, load_data

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

def calculate_revenue_from_bookings(data: Dict[str, Any], start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
    """Calculate revenue from bookings/payment data"""
    clients = data.get("clients", [])
    appointments = data.get("appointments", {})
    
    total_revenue = 0
    service_revenue = {}
    monthly_revenue = {}
    
    # Process payment history from clients
    for client in clients:
        if isinstance(client, dict) and "payment_history" in client:
            for payment in client.get("payment_history", []):
                if isinstance(payment, dict):
                    amount = payment.get("amount", 0)
                    date_str = payment.get("date", "")
                    
                    # Filter by date range if provided
                    if start_date and date_str < start_date:
                        continue
                    if end_date and date_str > end_date:
                        continue
                    
                    total_revenue += amount
                    
                    # Extract month for monthly breakdown
                    if date_str:
                        try:
                            month_key = date_str[:7]  # YYYY-MM format
                            monthly_revenue[month_key] = monthly_revenue.get(month_key, 0) + amount
                        except:
                            pass
    
    # Process upcoming appointments for recent revenue
    upcoming = appointments.get("upcoming_today", [])
    for appointment in upcoming:
        if isinstance(appointment, dict):
            price = appointment.get("price", 0)
            if isinstance(price, str):
                try:
                    price = float(price)
                except:
                    price = 0
            total_revenue += price
    
    return {
        "total_revenue": total_revenue,
        "monthly_revenue": monthly_revenue,
        "service_revenue": service_revenue
    }

def calculate_retention_rate(data: Dict[str, Any]) -> float:
    """Calculate customer retention rate"""
    clients = data.get("clients", [])
    
    if not clients:
        return 0.0
    
    returning_clients = 0
    total_clients = len(clients)
    
    for client in clients:
        if isinstance(client, dict):
            appointment_history = client.get("appointment_history", [])
            if isinstance(appointment_history, list) and len(appointment_history) > 1:
                returning_clients += 1
    
    return round((returning_clients / total_clients) * 100, 1) if total_clients > 0 else 0.0

def calculate_popular_treatments(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Count bookings per service"""
    clients = data.get("clients", [])
    appointments = data.get("appointments", {})
    services = data.get("services", [])
    
    service_counts = {}
    total_bookings = 0
    
    # Count from client appointment history
    for client in clients:
        if isinstance(client, dict):
            appointment_history = client.get("appointment_history", [])
            for appointment in appointment_history:
                if isinstance(appointment, dict):
                    service_name = appointment.get("service", "Unknown")
                    service_counts[service_name] = service_counts.get(service_name, 0) + 1
                    total_bookings += 1
    
    # Count from upcoming appointments
    upcoming = appointments.get("upcoming_today", [])
    for appointment in upcoming:
        if isinstance(appointment, dict):
            service_name = appointment.get("service", "Unknown")
            service_counts[service_name] = service_counts.get(service_name, 0) + 1
            total_bookings += 1
    
    # Convert to percentages
    popular_treatments = []
    for service_name, count in service_counts.items():
        percentage = round((count / total_bookings) * 100, 1) if total_bookings > 0 else 0
        popular_treatments.append({
            "name": service_name,
            "value": f"{percentage}%",
            "bookings": count,
            "revenue": 0  # Will be calculated separately
        })
    
    # Sort by percentage
    popular_treatments.sort(key=lambda x: float(x["value"].replace("%", "")), reverse=True)
    return popular_treatments[:10]  # Top 10

def calculate_peak_hours(data: Dict[str, Any]) -> Dict[str, Any]:
    """Analyze peak booking hours"""
    appointments = data.get("appointments", {})
    upcoming = appointments.get("upcoming_today", [])
    
    hourly_bookings = {}
    
    for appointment in upcoming:
        if isinstance(appointment, dict):
            time_str = appointment.get("time", "")
            if isinstance(time_str, str):
                try:
                    # Extract hour from time string (e.g., "10:00 AM - 11:30 AM")
                    hour_part = time_str.split(" - ")[0].strip()
                    if ":" in hour_part:
                        hour = int(hour_part.split(":")[0])
                        if "PM" in hour_part and hour != 12:
                            hour += 12
                        elif "AM" in hour_part and hour == 12:
                            hour = 0
                        
                        hourly_bookings[hour] = hourly_bookings.get(hour, 0) + 1
                except:
                    pass
    
    # Find peak hour
    peak_hour = max(hourly_bookings.items(), key=lambda x: x[1]) if hourly_bookings else (0, 0)
    
    return {
        "hourly_bookings": hourly_bookings,
        "peak_hour": peak_hour[0],
        "peak_bookings": peak_hour[1]
    }

def generate_ai_insights(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Generate dynamic AI insights based on data"""
    insights = []
    
    # Analyze occupancy
    appointments = data.get("appointments", {})
    upcoming = appointments.get("upcoming_today", [])
    
    if len(upcoming) > 0:
        occupancy_rate = min(100, (len(upcoming) / 12) * 100)  # Assuming 12 slots per day
        
        if occupancy_rate > 80:
            insights.append({
                "type": "price_increase",
                "message": f"High occupancy ({occupancy_rate:.1f}%) detected. Consider increasing prices by 8-12% for peak hours.",
                "priority": "high",
                "potential_revenue": round(occupancy_rate * 50)  # Estimated potential
            })
        elif occupancy_rate < 40:
            insights.append({
                "type": "discount",
                "message": f"Low occupancy ({occupancy_rate:.1f}%) detected. Consider offering 10-15% discounts for off-peak hours.",
                "priority": "medium",
                "potential_revenue": round((100 - occupancy_rate) * 30)
            })
    
    # Analyze popular services
    popular = calculate_popular_treatments(data)
    if popular:
        top_service = popular[0]
        if float(top_service["value"].replace("%", "")) > 30:
            insights.append({
                "type": "service_optimization",
                "message": f"{top_service['name']} represents {top_service['value']} of bookings. Consider creating premium packages.",
                "priority": "medium",
                "service": top_service["name"]
            })
    
    return insights

@router.get("/revenue")
def get_revenue_analytics(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)")
) -> Any:
    """Get revenue analytics with optional date filtering"""
    try:
        data = load_data()
        revenue_data = calculate_revenue_from_bookings(data, start_date, end_date)
        return revenue_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/retention")
def get_retention_analytics() -> Any:
    """Get customer retention rate"""
    try:
        data = load_data()
        retention_rate = calculate_retention_rate(data)
        return {"retention_rate": retention_rate}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/popular-treatments")
def get_popular_treatments() -> Any:
    """Get popular treatments with booking counts"""
    try:
        data = load_data()
        treatments = calculate_popular_treatments(data)
        return {"popular_treatments": treatments}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/peak-hours")
def get_peak_hours_analysis() -> Any:
    """Get peak hours analysis"""
    try:
        data = load_data()
        peak_data = calculate_peak_hours(data)
        return peak_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ai-insights")
def get_ai_insights() -> Any:
    """Get AI-generated insights"""
    try:
        data = load_data()
        insights = generate_ai_insights(data)
        return {"insights": insights}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/comprehensive")
def get_comprehensive_analytics(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    therapist_filter: Optional[str] = Query(None, description="Filter by therapist name"),
    service_filter: Optional[str] = Query(None, description="Filter by service name")
) -> Any:
    """Get comprehensive analytics with all filters"""
    try:
        data = load_data()
        
        # Calculate all metrics
        revenue_data = calculate_revenue_from_bookings(data, start_date, end_date)
        retention_rate = calculate_retention_rate(data)
        popular_treatments = calculate_popular_treatments(data)
        peak_hours = calculate_peak_hours(data)
        ai_insights = generate_ai_insights(data)
        
        # Apply filters if provided
        if service_filter:
            popular_treatments = [t for t in popular_treatments if service_filter.lower() in t["name"].lower()]
        
        return {
            "revenue": revenue_data,
            "retention_rate": retention_rate,
            "popular_treatments": popular_treatments,
            "peak_hours": peak_hours,
            "ai_insights": ai_insights,
            "filters_applied": {
                "start_date": start_date,
                "end_date": end_date,
                "therapist_filter": therapist_filter,
                "service_filter": service_filter
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
