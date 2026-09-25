// Custom desk structure: pins the two singleton docs (siteSettings,
// privacyPolicy) as single editable items with no create/duplicate/delete
// affordances, and lists all `project` docs beneath them.
export const deskStructure = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site Settings')
        .id('siteSettings')
        .child(
          S.document()
            .schemaType('siteSettings')
            .documentId('siteSettings')
        ),
      S.listItem()
        .title('Privacy Policy')
        .id('privacyPolicy')
        .child(
          S.document()
            .schemaType('privacyPolicy')
            .documentId('privacyPolicy')
        ),
      S.listItem()
        .title('Info Page')
        .id('infoPage')
        .child(
          S.document()
            .schemaType('infoPage')
            .documentId('infoPage')
        ),
      S.divider(),
      S.documentTypeListItem('project').title('Projects'),
      S.documentTypeListItem('article').title('Articles'),
    ])
