"""
djangoCMS plugin configuration
"""
from django.utils.translation import ugettext_lazy as _

from cms.plugin_base import CMSPluginBase
from cms.plugin_pool import plugin_pool

from .forms import MapsForm
from .models import Maps, MapsMarker
from .settings import API_KEYS


class MapsPlugin(CMSPluginBase):
    """
    The djangocms_maps plugin
    """
    model = Maps
    name = _("Maps")
    render_template = "djangocms_maps/maps.html"
    admin_preview = False
    allow_children = True
    child_classes = ["MapsMarkerPlugin"]
    form = MapsForm
    fieldsets = (
        (None, {
            'fields': (
                'title',
                ('address', 'city'),
                ('zipcode', 'zoom',),
                ('lat', 'lng'),
            ),
        }),
        (_('Advanced'), {
            'fields': (
                ('map_provider', 'info_window'),
                ('width', 'height'),
                # ('route_planer', 'route_planer_title'),
                ('scrollwheel', 'double_click_zoom', 'draggable',
                 'keyboard_shortcuts'),
                ('pan_control', 'zoom_control', 'street_view_control',
                 'layers_control', 'scale_bar'),
                'style',
            ),
        }),
    )

    def render(self, context, instance, placeholder):
        context.update({
            'api_key': API_KEYS[instance.map_provider],
            'object': instance,
            'placeholder': placeholder,
        })
        return context


class MapsMarkerPlugin(CMSPluginBase):
    model = MapsMarker
    name = _('Marker')
    module = _('Maps')
    require_parent = True
    parent_classes = ['MapsPlugin']

    fieldsets = [
        (None, {
            'fields': (
                'title',
                'address',
                ('lat', 'lng',),
                'icon',
            )
        }),
        (_('Info window'), {
            'classes': ('collapse',),
            'fields': (
                'show_content',
                'info_content',
            )
        }),
    ]

    def get_render_template(self, context, instance, placeholder):
        return 'djangocms_maps/marker.html'


plugin_pool.register_plugin(MapsPlugin)
plugin_pool.register_plugin(MapsMarkerPlugin)
