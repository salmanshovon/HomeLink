"""Leads services: requirement, match, and lead creation."""

from django.db import transaction
from rest_framework.exceptions import ValidationError

from .models import (
    Lead,
    LeadStatus,
    MatchStatus,
    RequirementMatch,
    RentalRequirement,
    RequirementStatus,
)


def create_requirement(*, tenant, entered_by, preferred_locations=None, min_rent=None,
                       max_rent=None, bedrooms=None, bathrooms=None, min_size_sqft=None,
                       property_type='', furnishing='', preferred_amenities=None,
                       occupants=None, tenant_category='', desired_move_in_date=None,
                       lease_duration_months=None, additional_requirements='',
                       advance_budget=None, status=RequirementStatus.DRAFT):
    """Create a :class:`RentalRequirement`.

    ``tenant`` is the customer the requirement belongs to; ``entered_by`` is the
    actor creating it (a tenant creating their own, or staff creating on behalf
    of a customer).
    """
    with transaction.atomic():
        requirement = RentalRequirement.objects.create(
            tenant=tenant,
            entered_by=entered_by,
            preferred_locations=preferred_locations or [],
            min_rent=min_rent,
            max_rent=max_rent,
            bedrooms=bedrooms,
            bathrooms=bathrooms,
            min_size_sqft=min_size_sqft,
            property_type=property_type or '',
            furnishing=furnishing or '',
            occupants=occupants,
            tenant_category=tenant_category or '',
            desired_move_in_date=desired_move_in_date,
            lease_duration_months=lease_duration_months,
            additional_requirements=additional_requirements or '',
            advance_budget=advance_budget,
            status=status,
        )
        if preferred_amenities:
            requirement.preferred_amenities.set(preferred_amenities)
        return requirement


def create_match(*, requirement, listing, suggested_by, match_score=None, rationale='',
                 status=MatchStatus.SUGGESTED, customer_feedback='', internal_notes=''):
    """Create a :class:`RequirementMatch`, preventing duplicate pairs.

    Duplicates are prevented via the ``unique_together`` constraint on
    ``(requirement, listing)``; a friendly validation error is raised first.
    """
    with transaction.atomic():
        if RequirementMatch.objects.filter(requirement=requirement, listing=listing).exists():
            raise ValidationError('A match for this requirement and listing already exists.')
        return RequirementMatch.objects.create(
            requirement=requirement,
            listing=listing,
            suggested_by=suggested_by,
            match_score=match_score,
            rationale=rationale or '',
            status=status,
            customer_feedback=customer_feedback or '',
            internal_notes=internal_notes or '',
        )


def create_lead(*, name, phone, email='', source='', status=LeadStatus.NEW,
                assigned_agent=None, requirement=None, next_follow_up=None, notes=''):
    """Create a :class:`Lead`."""
    with transaction.atomic():
        return Lead.objects.create(
            name=name,
            phone=phone,
            email=email or '',
            source=source or '',
            status=status,
            assigned_agent=assigned_agent,
            requirement=requirement,
            next_follow_up=next_follow_up,
            notes=notes or '',
        )
