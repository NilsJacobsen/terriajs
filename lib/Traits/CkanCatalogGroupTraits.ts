import CkanSharedTraits from "./CkanSharedTraits";
import CatalogMemberTraits from "./CatalogMemberTraits";
import GroupTraits from "./GroupTraits";
import ModelTraits from "./ModelTraits";
import mixTraits from "./mixTraits";
import UrlTraits from "./UrlTraits";
import primitiveTrait from "./primitiveTrait";
import objectTrait from "./objectTrait";
import anyTrait from "./anyTrait";
import modelReferenceArrayTrait from "./modelReferenceArrayTrait";
import JsonObject from "../Core/Json";

export default class CkanCatalogGroupTraits extends mixTraits(
  GroupTraits,
  UrlTraits,
  CatalogMemberTraits,
  CkanSharedTraits
) {
  @anyTrait({
    name: "Blacklist",
    description: `An array of strings of blacklisted group names and dataset titles.
      A group or dataset that appears in this list will not be shown to the user.`
  })
  blacklist?: string[];

  @primitiveTrait({
    type: "string",
    name: "Filter Query",
    description: `Gets or sets the filter query to pass to CKAN when querying the available data sources and their groups. Each item in the
         * array causes an independent request to the CKAN, and the results are concatenated.  The
         * search string is equivalent to what would be in the parameters segment of the url calling the CKAN search api.
         * See the [Solr documentation](http://wiki.apache.org/solr/CommonQueryParameters#fq) for information about filter queries.
         * Each item can be either a URL-encoded string ("fq=res_format%3awms") or an object ({ fq: 'res_format:wms' }). The latter
         * format is easier to work with.
         *   To get all the datasets with wms resources: [{ fq: 'res_format%3awms' }]
         *   To get all wms/WMS datasets in the Surface Water group: [{q: 'groups=Surface Water', fq: 'res_format:WMS' }]
         *   To get both wms and esri-mapService datasets: [{q: 'res_format:WMS'}, {q: 'res_format:"Esri REST"' }]
         *   To get all datasets with no filter, you can use ['']
         * This property is required.
         * This property is observable.
       `
  })
  filterQuery?: string =
    '+(res_format:(geojson OR GeoJSON OR WMS OR wms OR kml OR WFS OR wfs OR CSV-GEO-AU OR csv-geo-au OR "Esri REST"))';

  @primitiveTrait({
    type: "string",
    name: "Group By",
    description: `Gets or sets a value indicating how datasets should be grouped.  Valid values are:
     * none - Datasets are put in a flat list; they are not grouped at all.
     * group - Datasets are grouped according to their CKAN group.  Datasets that are not in any groups are put at the top level.
     * organization - Datasets are grouped by their CKAN organization.  Datasets that are not associated with an organization are put at the top level.
     `
  })
  groupBy?: "organization" | "group" | "none" = "organization";

  @primitiveTrait({
    type: "string",
    name: "Ungrouped title",
    description: `A title for the group holding all items that don't have a group in CKAN.
      If the value is a blank string or undefined, these items will be left at the top level, not grouped.`
  })
  ungroupedTitle: string = "No group";
}
