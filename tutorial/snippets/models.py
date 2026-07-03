from django.db import models
from django.db import models
from pygments.lexers import get_all_lexers
from pygments.styles import get_all_styles
from pygments.lexers import get_lexer_by_name
from pygments.formatters.html import HtmlFormatter
from pygments import highlight

LEXERS = [item for item in get_all_lexers() if item[1]]
LANGUAGE_CHOICES = sorted([(item[1][0], item[0]) for item in LEXERS])
STYLE_CHOICES = sorted([(item, item) for item in get_all_styles()])


class Snippet(models.Model):
    created = models.DateTimeField(auto_now_add=True)
    title = models.CharField(max_length=100, blank=True, default="")
    code = models.TextField()
    linenos = models.BooleanField(default=False)
    language = models.CharField(
        choices=LANGUAGE_CHOICES, default="python", max_length=100
    )
    style = models.CharField(choices=STYLE_CHOICES, default="friendly", max_length=100)
    owner = models.ForeignKey(
        "auth.User", related_name="snippets", on_delete=models.CASCADE
    )
    highlighted = models.TextField(blank = True)


    def save(self, *args, **kwargs):
    # Override model save method to customize behavior before saving.

    #Use the `pygments` library to create a highlighted HTML representation of the code snippet.
        lexer = get_lexer_by_name(self.language)# Select syntax lexer based on chosen programming language.
        linenos = "table" if self.linenos else False# Enable line numbers if user requested, otherwise disable them.
        options = {"title": self.title} if self.title else {}# Add snippet title to generated HTML when title exists.
        formatter = HtmlFormatter(
        style=self.style,
        linenos=linenos,
        full=True,
        **options
    )
    # Configure HTML formatter with style, title, and line numbers.
        self.highlighted = highlight(self.code, lexer, formatter)
    # Convert source code into syntax-highlighted HTML representation automatically.
        super().save(*args, **kwargs)
    # Call parent save method to store object in database.

    class Meta:
        ordering = ["created"]  