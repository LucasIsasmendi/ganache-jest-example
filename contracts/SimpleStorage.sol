pragma solidity ^0.5.2;

contract SimpleStorage {
  uint storedData = 0;

  event Set(uint x);

  constructor() public {
    emit Set(0);
  }

  function set(uint x) public {
    storedData = x;
    emit Set(x);
  }

  function get() public view returns (uint) {
    return storedData;
  }
}
