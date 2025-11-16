class TableSettings {
    constructor({
      columns = [],
      url = '',
      editFormStyle = '',
      editable = true,
      deletable = true,
      extraSettings = {},
    } = {}) {
      this.columns = columns;
      this.url = url;
      this.editFormStyle = editFormStyle;
      this.editable = editable;
      this.deletable = deletable;
      this.extraSettings = extraSettings;
    }
  }
  
  export default TableSettings;
  