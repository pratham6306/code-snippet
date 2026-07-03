from rest_framework import serializers
from snippets.models import Snippet, LANGUAGE_CHOICES, STYLE_CHOICES
from django.contrib.auth.models import User

class SnippetSerializer(serializers.ModelSerializer):
    owner = serializers.ReadOnlyField(source="owner.username")
    class Meta:
        model = Snippet
        fields = ["id", "title", "code", "linenos", "language", "style", "owner"]
    # in model serializer all thing are automatically generated including create and update methods, so we don't need to write them explicitly

class UserSerializer(serializers.ModelSerializer):
    snippets = serializers.PrimaryKeyRelatedField(#showing snippets related to user in user serializer using primary key related field
        many=True, queryset=Snippet.objects.all()
    )
    class Meta:
        model = User
        fields = ["id", "username", "snippets"]


class UserRegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "password"]

    def create(self, validated_data):
        # We use create_user to ensure the password gets hashed correctly by Django
        user = User.objects.create_user(
            username=validated_data["username"],
            password=validated_data["password"]
        )
        return user

# class SnippetSerializer(serializers.Serializer):
#     id = serializers.IntegerField(read_only = True)
#     title = serializers.CharField(required = False, allow_blank = True, max_length = 100)
#     code = serializers.CharField(sytle = {"base_template":"textarea.html"})
#     linenos = serializers.BooleanField(required = False)
#     language = serializers.ChoiceField(choices = LANGUAGE_CHOICES, default = "python")
#     style = serializers.ChoiceField(choices=STYLE_CHOICES, default = "friendly")

#     def create(self, validated_data):
#         return Snippet.objects.create(**validated_data)
#     def update(self, instance, validated_data):
#         instance.title = validated_data.get("title", instance.title)
#         instance.code = validated_data.get("code", instance.code)
#         instance.linenos = validated_data.get("linenos", instance.linenos)
#         instance.language = validated_data.get("language", instance.language)
#         instance.style = validated_data.get("style", instance.style)
#         instance.save()
#         return instance