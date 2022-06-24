import * as React from "react";
import Paper from "@mui/material/Paper";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell, { tableCellClasses } from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import styled from "@emotion/styled";
import AddchartIcon from "@mui/icons-material/Addchart";
import useAxiosPrivate from "../../hooks/useAxiosPrivate";
import { useNavigate } from "react-router-dom";
import {
  CircularProgress,
  FormControl,
  Grid,
  Input,
  InputAdornment,
  InputLabel,
  TextField,
} from "@mui/material";
import { Search } from "@mui/icons-material";
import moment from "moment";
const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#2a2d3e",
    color: "white",
  },
  [`&.${tableCellClasses.body}`]: {
    // fontSize: 14,
  },
}));

const columns = [
  { id: "orderID", label: "Order Id", minWidth: 100 },

  {
    id: "timeDAte",
    label: "Time & Date",
    minWidth: 170,
    align: "right",
    // format: (value) => value.toLocaleString('en-US'),
  },
  {
    id: "packages",
    label: "Packages",
    minWidth: 210,
    align: "right",
    // format: (value) => value.toLocaleString('en-US'),
  },
  {
    id: "status",
    label: "Status",
    minWidth: 170,
    align: "right",
    // format: (value) => value.toLocaleString('en-US'),
  },
  {
    id: "options",
    label: "Options",
    minWidth: 170,
    align: "right",
    // format: (value) => value.toFixed(2),
  },
];

function createData(orderID, timeDAte, packages, options) {
  return { orderID, timeDAte, packages, options };
}

// const rows = [
//   createData('1059', '22/03/2022, 20:23:48', 1324171354, <button className="button is-info"><AddchartIcon/>Add Data</button>),
//   createData('1025', '22/03/2022, 20:23:48', 1403500365, <button className="button is-info"><AddchartIcon/>Add Data</button>),
//   createData('1023', '22/03/2022, 20:23:48', 60483973, <button className="button is-info"><AddchartIcon/>Add Data</button>),
//   createData('1022', '22/03/2022, 20:23:48', 327167434, <button className="button is-info"><AddchartIcon/>Add Data</button>),
//   createData('1000', '22/03/2022, 20:23:48', 37602103, <button className="button is-info"><AddchartIcon/>Add Data</button>),
//   createData('1001', '22/03/2022, 20:23:48', 25475400, <button className="button is-info"><AddchartIcon/>Add Data</button>),

// ];

export default function DataTable() {
  const [page, setPage] = React.useState(0);
  const [rowsPerPage, setRowsPerPage] = React.useState(5);
  const [rows, setRows] = React.useState([]);
  const [data, setData] = React.useState([]);
  const axiosPrivate = useAxiosPrivate();
  const navigate = useNavigate();
  const [isLoading, setLoading] = React.useState(true);
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(+event.target.value);
    setPage(0);
  };
  // const handleOnClickAddData = (id) => {
  //   navigate(`/select/${id}`);
  // };

  const handleOnClickEditData = (id) => {
    navigate(`/view/${id}`);
  };
  
  const handleSearch = e => {
    if(!e.target.value || !e.target.value.trim())return;
    let searchInput = e.target.value;
    let filteredData = data.filter(value => {
      return (
        value.timeDAte.toLowerCase().includes(searchInput.toLowerCase()) ||
        value.packages.toLowerCase().includes(searchInput.toLowerCase()) 
      );
    });
    setRows([...filteredData]);
}

  React.useEffect(() => {
    const getData = async () => {
      setLoading(true);
      try {
        const response = await axiosPrivate.get(
          "https://tax.api.cyberozunu.com/api/v1.1/Order"
        );
        const filtered = [
          ...response.data.result.data.map((n,k) =>
            createData(
              n.serialNo,
              moment(n.createdOn).format("DD/MM/YYYY, HH:mm:ss"),
              n.selectedPackages.map((p) => " " + p.package.name).join(","),
              <div id={n.serialNo+"-"+k} style={{ width: "300px" }}>
                <button
                  onClick={() => null}
                  
                  className="button is-info is-small"
                >
                  <AddchartIcon />
                  <p style={{ marginLeft: "0.5rem" }}>{"Update Status"}</p>
                </button>
                <button
                  style={{ marginLeft: "0.5rem" }}
                  onClick={() => handleOnClickEditData(n.id)}
                 
                  className="button is-warning is-small"
                >
                  <AddchartIcon />
                  <p style={{ marginLeft: "0.5rem" }}>{"View Data"}</p>
                </button>
              </div>
            )
          ),
        ]
        setRows([...filtered]);
        setData([...filtered]);
        setLoading(false);
      } catch (err) {
        console.error(err);
        // navigate('/', { state: { from: location }, replace: true });
        setLoading(false);
      }
    };

    getData();
  }, []);

  return (
    <div>
      <TextField
        id="outlined-basic"
        label="Search"
        variant="outlined"
        fullWidth
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
        onChange={handleSearch}
        sx={{ marginBottom: "1rem" }}
      />

      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        {isLoading ? (
          <CircularProgress />
        ) : (
          <>
            <TableContainer sx={{ backgroundColor: "#f5f5f5" }}>
              <Table stickyHeader aria-label="sticky table">
                <TableHead>
                  <TableRow>
                    {columns.map((column, n) => (
                      <StyledTableCell
                        key={column.id + "-" + n}
                        align={column.align}
                        style={{ minWidth: column.minWidth }}
                      >
                        {column.label}
                      </StyledTableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, idx) => {
                      return (
                        <TableRow
                          hover
                          role="checkbox"
                          tabIndex={-1}
                          key={row.orderID + "-" + idx}
                        >
                          {columns.map((column, i) => {
                            const value = row[column.id];
                            return (
                              <TableCell
                                key={
                                  row.orderID + "-" + idx + column.id + "-" + i
                                }
                                align={column.align}
                              >
                                {column.format && typeof value === "number"
                                  ? column.format(value)
                                  : value}
                              </TableCell>
                            );
                          })}
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 100]}
              component="div"
              count={rows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </>
        )}
      </Paper>
    </div>
  );
}
