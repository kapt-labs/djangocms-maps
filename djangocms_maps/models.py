"""
Django models for djangocms_maps
"""
from django.db import models
from django.utils.translation import ugettext_lazy as _

from cms.models import CMSPlugin

from filer.fields.image import FilerImageField

from .settings import PROVIDERS


class Maps(CMSPlugin):
    """
    Integration of a map with support for different providers
    """
    translatable_content_excluded_fields = [
        'address', 'zipcode', 'width', 'height']

    map_provider = models.CharField(
        _("map provider"), max_length=16, blank=False, null=False,
        choices=PROVIDERS, default=PROVIDERS[0][0])

    title = models.CharField(_("map title"), max_length=100, blank=True,
                             null=True)

    address = models.CharField(_("address"), max_length=150)
    zipcode = models.CharField(_("zip code"), max_length=30)
    city = models.CharField(_("city"), max_length=100)

    style = models.TextField(
        _("custom map style"), blank=True,
        help_text=_(
            'Provide a valid JSON configuration (escaped). See '
            'developers.google.com/maps/documentation/javascript/styling'))

    ZOOM_LEVELS = [(c, str(c)) for c in range(22)]
    zoom = models.PositiveSmallIntegerField(
        _("zoom level"), choices=ZOOM_LEVELS, default=13)

    lat = models.DecimalField(
        _('latitude'), max_digits=10, decimal_places=6, null=True, blank=True,
        help_text=_('Use latitude & longitude to fine tune the map position.'))

    lng = models.DecimalField(
        _('longitude'), max_digits=10, decimal_places=6, null=True, blank=True)

    route_planer_title = models.CharField(
        _("route planner title"), max_length=150, blank=True, null=True,
        default=_('Calculate your fastest way to here'))

    route_planer = models.BooleanField(_("route planner"), default=False)

    width = models.CharField(
        _('width'), max_length=6, default='100%',
        help_text=_('Plugin width (in px, em, %).'))

    height = models.CharField(
        _('height'), max_length=6, default='400px',
        help_text=_('Plugin height (in px, em).'))

    info_window = models.BooleanField(
        _('info window'), default=True,
        help_text=_('Show textbox over marker'))

    scrollwheel = models.BooleanField(
        _('scrollwheel'), default=True,
        help_text=_('Enable scrollwheel zooming on the map'))

    double_click_zoom = models.BooleanField(
        _('double click zoom'), default=True)

    draggable = models.BooleanField(_('draggable'), default=True)

    keyboard_shortcuts = models.BooleanField(
        _('keyboard shortcuts'), default=True)

    pan_control = models.BooleanField(_('Pan control'), default=True)

    zoom_control = models.BooleanField(_('Zoom control'), default=True)

    street_view_control = models.BooleanField(
        _('Street View control'), default=True)

    layers_control = models.BooleanField(_('Layers control'), default=True)

    scale_bar = models.BooleanField(_('Scale bar'), default=False)

    def __str__(self):
        return "%s (%s, %s %s)" % (
            self.get_title(),
            self.address,
            self.zipcode,
            self.city,
        )

    def get_title(self):
        """Title displayed as a map header"""
        return _("Map") if self.title is None else self.title

    def get_lat_lng(self):
        """Lat/Lon tuple or None (if unset)"""
        if self.lat and self.lng:
            return self.lat, self.lng
        return None


class MapsMarker(CMSPlugin):
    """
    Renders a marker inside the Maps wrapper
    """
    title = models.CharField(
        verbose_name=_('Title'),
        max_length=255,
        blank=True,
    )
    address = models.CharField(
        verbose_name=_('Full address'),
        max_length=255,
        blank=True,
        help_text=_('Note: Latitude and longitude can be used to fine-tune the location.'),
    )
    lat = models.FloatField(
        verbose_name=_('Latitude (lat)'),
        null=True,
        blank=True,
        help_text=_('Geographical latitude in degrees (e.g. "46.947973").'),
    )
    lng = models.FloatField(
        verbose_name=_('Longitude (lng)'),
        null=True,
        blank=True,
        help_text=_('Geographical longitude in degrees (e.g. "7.447446").'),
    )
    icon = FilerImageField(
        verbose_name=_('Icon'),
        blank=True,
        null=True,
        on_delete=models.SET_NULL,
        help_text=_('A marker icon identifies a location on a map. '
                    'A default icon is provided by default.'),
    )
    # info window settings
    show_content = models.BooleanField(
        verbose_name=_('Show window'),
        default=True,
        help_text=_('Display the info window when the map loads.'),
    )
    info_content = models.TextField(
        verbose_name=_('Info window content'),
        blank=True,
        help_text=_('Will be displayed in the info window attached to the marker.'),
    )

    def __str__(self):
        return str(self.pk)

    def get_short_description(self):
        display = []
        if self.title:
            display.append(self.title)
        if self.address:
            display.append(self.address)
        if self.lat and self.lng:
            display.append('{0} / {1}'.format(self.lat, self.lng))
        return ', '.join(display)

