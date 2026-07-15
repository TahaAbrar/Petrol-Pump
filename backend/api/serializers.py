from django.contrib.auth import authenticate
from rest_framework import serializers

from .models import (
    SiteSettings,
    PageContent,
    Employee,
    EventItem,
    EventImage,
    Review,
    ServiceItem,
    ServiceImage,
    FeaturedVideo,
)


class SiteSettingsSerializer(serializers.ModelSerializer):
    logo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = SiteSettings
        exclude = ["id"]


class PageContentSerializer(serializers.ModelSerializer):
    banner = serializers.ImageField(required=False, allow_null=True)
    story_image = serializers.ImageField(required=False, allow_null=True)
    founder_image = serializers.ImageField(required=False, allow_null=True)
    ceo2_image = serializers.ImageField(required=False, allow_null=True)
    manager_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = PageContent
        fields = [
            "id", "key", "title", "subtitle", "body", "banner",
            "story_image", "founder_image", "ceo2_image", "manager_image",
            "extra", "updated_at",
        ]
        read_only_fields = ["updated_at"]


class EmployeeSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Employee
        fields = [
            "id", "name", "slug", "role", "image", "experience",
            "bio", "responsibilities", "email", "order", "text_colors", "created_at",
        ]
        read_only_fields = ["slug", "created_at"]


class EventImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = EventImage
        fields = ["id", "image", "order"]


class EventItemSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    video = serializers.FileField(required=False, allow_null=True)
    images = EventImageSerializer(many=True, read_only=True)

    class Meta:
        model = EventItem
        fields = [
            "id", "title", "slug", "description", "long_description",
            "date", "image", "video", "images", "featured", "order", "text_colors", "created_at",
        ]
        read_only_fields = ["slug", "created_at"]


class ServiceImageSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = ServiceImage
        fields = ["id", "image", "order"]


class ServiceItemSerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False, allow_null=True)
    images = ServiceImageSerializer(many=True, read_only=True)

    class Meta:
        model = ServiceItem
        fields = [
            "id", "title", "slug", "category", "description", "long_description",
            "availability", "quantity", "price", "highlights",
            "image", "images", "featured", "order", "text_colors", "created_at",
        ]
        read_only_fields = ["slug", "created_at"]


class FeaturedVideoSerializer(serializers.ModelSerializer):
    video = serializers.FileField(required=False, allow_null=True)

    class Meta:
        model = FeaturedVideo
        fields = ["id", "title", "video", "order", "created_at"]
        read_only_fields = ["created_at"]


class ChangeCredentialsSerializer(serializers.Serializer):
    current_password = serializers.CharField(required=False, allow_blank=True, trim_whitespace=False)
    username = serializers.CharField(required=False, allow_blank=True)
    email = serializers.EmailField(required=False, allow_blank=True)
    new_password = serializers.CharField(required=False, allow_blank=True, trim_whitespace=False)
    new_password_confirm = serializers.CharField(required=False, allow_blank=True, trim_whitespace=False)

    def validate(self, attrs):
        from django.contrib.auth import get_user_model

        user = self.context["request"].user
        User = get_user_model()

        username = (attrs.get("username") or "").strip()
        email = (attrs.get("email") or "").strip()
        new_password = attrs.get("new_password") or ""
        new_password_confirm = attrs.get("new_password_confirm") or ""
        current_password = attrs.get("current_password") or ""

        changing_password = bool(new_password or new_password_confirm)
        changing_profile = bool(username or email)

        if not changing_password and not changing_profile:
            raise serializers.ValidationError("Provide at least one field to update.")

        if changing_password:
            if not current_password:
                raise serializers.ValidationError({"current_password": "Current password is required."})
            if not user.check_password(current_password):
                raise serializers.ValidationError({"current_password": "Current password is incorrect."})
            if len(new_password) < 8:
                raise serializers.ValidationError({"new_password": "Password must be at least 8 characters."})
            if new_password != new_password_confirm:
                raise serializers.ValidationError({"new_password_confirm": "Passwords do not match."})

        if username and User.objects.filter(username=username).exclude(pk=user.pk).exists():
            raise serializers.ValidationError({"username": "This username is already taken."})

        attrs["username"] = username
        attrs["email"] = email
        attrs["new_password"] = new_password
        return attrs

    def save(self):
        user = self.context["request"].user
        username = self.validated_data.get("username")
        email = self.validated_data.get("email")
        new_password = self.validated_data.get("new_password")

        if username:
            user.username = username
        if email is not None:
            user.email = email
        if new_password:
            user.set_password(new_password)
        user.save()
        return user


class ReviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Review
        fields = ["id", "name", "role", "rating", "text", "approved", "order", "text_colors", "created_at"]
        read_only_fields = ["created_at"]


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(style={"input_type": "password"}, trim_whitespace=False)

    def validate(self, attrs):
        user = authenticate(
            request=self.context.get("request"),
            username=attrs.get("username"),
            password=attrs.get("password"),
        )
        if not user:
            raise serializers.ValidationError("Invalid username or password.", code="authorization")
        if not user.is_staff:
            raise serializers.ValidationError("This account is not an admin.", code="authorization")
        attrs["user"] = user
        return attrs


class UserSerializer(serializers.Serializer):
    id = serializers.IntegerField(read_only=True)
    username = serializers.CharField(read_only=True)
    email = serializers.EmailField(read_only=True)
    is_staff = serializers.BooleanField(read_only=True)
    is_superuser = serializers.BooleanField(read_only=True)
