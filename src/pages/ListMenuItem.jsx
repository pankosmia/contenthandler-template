import { PropTypes } from "prop-types";
import { Typography } from "@mui/material";

export default function ListMenuItem(listMenuItemProps) {
  const { listItem } = listMenuItemProps;

  const styles = {
    menuItem: {
      display: "flex",
      justifyContent: "space-between",
      color: "Black",
    },
  };

  return (
    <div style={styles.menuItem}>
      <div style={styles.menuItem}>
        <Typography
          style={{ width: "100%" }}
          noWrap
          variant="body2"
          component="div"
        >
          {listItem}
        </Typography>
      </div>
    </div>
  );
}

ListMenuItem.propTypes = {
  listItem: PropTypes.shape({
    index: PropTypes.objectOf(PropTypes.string),
  }),
};
